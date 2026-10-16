interface Env {
  DB: D1Database;
}

// GET /api/services - Returns all active services/APIs for the Home Page
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const all = url.searchParams.get('all') === 'true';

    const query = all
      ? 'SELECT * FROM services ORDER BY sort_order ASC, id ASC'
      : 'SELECT * FROM services WHERE is_active = 1 ORDER BY sort_order ASC, id ASC';

    const { results } = await db.prepare(query).all();

    return new Response(JSON.stringify({
      success: true,
      services: results || [],
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

// POST /api/services - Super Admin adds or updates a dynamic service/API
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
    } = body;

    if (!name || !service_key) {
      return new Response(JSON.stringify({ error: 'service_key and name are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
            sort_order = ?
        WHERE id = ?
      `).bind(
        name.trim(),
        subtitle || '',
        icon_type || 'emoji',
        icon_val || '⚡',
        bg_color || '#4f46e5',
        api_url || '',
        category || 'payment',
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        sort_order || 1,
        id
      ).run();

      return new Response(JSON.stringify({ success: true, message: 'Service updated successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Insert new
    const res = await db.prepare(`
      INSERT INTO services (service_key, name, subtitle, icon_type, icon_val, bg_color, api_url, category, is_active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(service_key) DO UPDATE SET
        name = excluded.name,
        subtitle = excluded.subtitle,
        icon_type = excluded.icon_type,
        icon_val = excluded.icon_val,
        bg_color = excluded.bg_color,
        api_url = excluded.api_url,
        category = excluded.category,
        is_active = excluded.is_active,
        sort_order = excluded.sort_order
    `).bind(
      service_key.trim().toLowerCase(),
      name.trim(),
      subtitle || '',
      icon_type || 'emoji',
      icon_val || '⚡',
      bg_color || '#4f46e5',
      api_url || `/${service_key}`,
      category || 'payment',
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      sort_order || 10
    ).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Service added successfully to D1',
      id: res.meta.last_row_id,
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
