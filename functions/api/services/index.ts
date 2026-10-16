interface Env {
  DB: D1Database;
}

// GET /api/services - Returns all active services/APIs with optional fields
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const all = url.searchParams.get('all') === 'true';
    const key = url.searchParams.get('key');
    const includeFields = url.searchParams.get('include_fields') === 'true';

    if (key) {
      const service = await db.prepare('SELECT * FROM services WHERE service_key = ?').bind(key).first();
      if (!service) {
        return new Response(JSON.stringify({ error: 'Service not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      const { results: fields } = await db.prepare('SELECT * FROM template_fields WHERE template_code = ? ORDER BY sort_order ASC, id ASC').bind(key).all();
      return new Response(JSON.stringify({ success: true, service: { ...service, fields: fields || [] } }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const query = all
      ? 'SELECT * FROM services ORDER BY sort_order ASC, id ASC'
      : 'SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC';

    const { results } = await db.prepare(query).all();
    const servicesList = results || [];

    if (includeFields && servicesList.length > 0) {
      const { results: allFields } = await db.prepare('SELECT * FROM template_fields ORDER BY sort_order ASC, id ASC').all();
      const fieldsByCode = (allFields || []).reduce((acc: any, field: any) => {
        acc[field.template_code] = acc[field.template_code] || [];
        acc[field.template_code].push(field);
        return acc;
      }, {});

      const enriched = servicesList.map((s: any) => ({
        ...s,
        fields: fieldsByCode[s.service_key] || [],
      }));

      return new Response(JSON.stringify({ success: true, services: enriched }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      services: servicesList,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/services - Super Admin adds or updates a dynamic service/API with parameters
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const body = await context.request.json() as any;
    const {
      id,
      service_key,
      name,
      subtitle,
      icon_type,
      icon_val,
      bg_color,
      api_url,
      category,
      is_active,
      sort_order,
      caption,
      button_name,
      has_second_msg,
      parameters, // Array of dynamic fields: [{ field_key, field_label, field_type, placeholder, is_required }]
    } = body;

    if (!name || !service_key) {
      return new Response(JSON.stringify({ error: 'service_key and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanKey = service_key.trim().toLowerCase();
    const cleanButtonName = button_name || subtitle || 'Fake Screenshot';
    const hasSecondMsgVal = has_second_msg === 1 || has_second_msg === true ? 1 : 0;

    if (id) {
      // Update existing
      await db.prepare(`
        UPDATE services
        SET name = ?,
            subtitle = ?,
            icon_type = ?,
            icon_val = ?,
            bg_color = ?,
            api_url = ?,
            category = ?,
            is_active = ?,
            sort_order = ?,
            has_second_msg = ?
        WHERE id = ?
      `).bind(
        name.trim(),
        cleanButtonName,
        icon_type || 'emoji',
        icon_val || caption || '⚡',
        bg_color || '#4f46e5',
        api_url || '',
        category || 'free',
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        sort_order || 1,
        hasSecondMsgVal,
        id
      ).run();
    } else {
      // Insert new
      await db.prepare(`
        INSERT INTO services (service_key, name, subtitle, icon_type, icon_val, bg_color, api_url, category, is_active, sort_order, has_second_msg)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(service_key) DO UPDATE SET
          name = excluded.name,
          subtitle = excluded.subtitle,
          icon_type = excluded.icon_type,
          icon_val = excluded.icon_val,
          bg_color = excluded.bg_color,
          api_url = excluded.api_url,
          category = excluded.category,
          is_active = excluded.is_active,
          sort_order = excluded.sort_order,
          has_second_msg = excluded.has_second_msg
      `).bind(
        cleanKey,
        name.trim(),
        cleanButtonName,
        icon_type || 'emoji',
        icon_val || caption || '⚡',
        bg_color || '#4f46e5',
        api_url || `/${cleanKey}`,
        category || 'free',
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        sort_order || 10,
        hasSecondMsgVal
      ).run();
    }

    // Keep templates table in sync with custom dynamic tool
    try {
      await db.prepare(`
        INSERT INTO templates (code, name, icon, color, is_active, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET
          name = excluded.name,
          icon = excluded.icon,
          color = excluded.color,
          is_active = excluded.is_active,
          sort_order = excluded.sort_order
      `).bind(
        cleanKey,
        name.trim(),
        icon_val || caption || '⚡',
        bg_color || '#4f46e5',
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        sort_order || 1
      ).run();
    } catch (tplErr) {
      console.warn('Templates sync note:', tplErr);
    }

    // Sync parameters if provided
    if (Array.isArray(parameters)) {
      // Clear previous fields for this service/template
      await db.prepare('DELETE FROM template_fields WHERE template_code = ?').bind(cleanKey).run();

      for (let i = 0; i < parameters.length; i++) {
        const param = parameters[i];
        if (param && param.field_key) {
          await db.prepare(`
            INSERT INTO template_fields (template_code, field_key, field_label, field_type, default_value, placeholder, is_required, section, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'general', ?)
          `).bind(
            cleanKey,
            param.field_key.trim(),
            (param.field_label || param.field_key).trim(),
            param.field_type || 'text',
            param.default_value || '',
            param.placeholder || '',
            param.is_required ? 1 : 0,
            i + 1
          ).run();
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Tool and parameters saved successfully to D1',
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/services?id=... - Remove a service
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing service id' }), { status: 400 });
    }

    const srv = await db.prepare('SELECT service_key FROM services WHERE id = ?').bind(id).first() as any;
    if (srv && srv.service_key) {
      await db.prepare('DELETE FROM template_fields WHERE template_code = ?').bind(srv.service_key).run();
      await db.prepare('DELETE FROM templates WHERE code = ?').bind(srv.service_key).run();
    }
    await db.prepare('DELETE FROM services WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true, message: 'Service deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
