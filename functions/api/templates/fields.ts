interface Env {
  DB: D1Database;
}

// POST /api/templates/fields - Add or update a dynamic parameter/option
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const body = await context.request.json() as any;
    const { 
      id, 
      template_code, 
      field_key, 
      field_label, 
      field_type, 
      default_value, 
      placeholder, 
      options, 
      options_json, 
      section, 
      sort_order 
    } = body;

    if (!template_code || !field_key || !field_label) {
      return new Response(JSON.stringify({ error: 'template_code, field_key, and field_label are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const finalOptionsJson = options ? JSON.stringify(options) : (options_json || null);

    if (id) {
      // Update existing field
      await db.prepare(`
        UPDATE template_fields
        SET field_label = ?,
            field_type = ?,
            default_value = ?,
            placeholder = ?,
            options_json = ?,
            section = ?,
            sort_order = ?
        WHERE id = ?
      `).bind(
        field_label,
        field_type || 'text',
        default_value || '',
        placeholder || '',
        finalOptionsJson,
        section || 'general',
        sort_order || 1,
        id
      ).run();

      return new Response(JSON.stringify({ success: true, message: 'Parameter updated successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Insert or replace new field
      const res = await db.prepare(`
        INSERT INTO template_fields (template_code, field_key, field_label, field_type, default_value, placeholder, options_json, section, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(template_code, field_key) DO UPDATE SET
          field_label = excluded.field_label,
          field_type = excluded.field_type,
          default_value = excluded.default_value,
          placeholder = excluded.placeholder,
          options_json = excluded.options_json,
          section = excluded.section,
          sort_order = excluded.sort_order
      `).bind(
        template_code,
        field_key.trim(),
        field_label.trim(),
        field_type || 'text',
        default_value || '',
        placeholder || '',
        finalOptionsJson,
        section || 'general',
        sort_order || 10
      ).run();

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Dynamic parameter saved successfully',
        id: res.meta.last_row_id 
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/templates/fields?id=... or ?all=true - Delete dynamic parameter(s)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    const templateCode = url.searchParams.get('template_code');
    const clearAll = url.searchParams.get('all') === 'true';

    if (clearAll) {
      await db.prepare('DELETE FROM template_fields').run();
      await db.prepare('DELETE FROM templates').run();
      return new Response(JSON.stringify({ success: true, message: 'All default templates and fields cleared from D1' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (templateCode) {
      await db.prepare('DELETE FROM template_fields WHERE template_code = ?').bind(templateCode).run();
      return new Response(JSON.stringify({ success: true, message: `All fields for ${templateCode} removed` }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing field id' }), { status: 400 });
    }

    await db.prepare('DELETE FROM template_fields WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true, message: 'Dynamic parameter removed successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
