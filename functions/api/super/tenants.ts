interface Env {
  DB: D1Database;
}

// GET /api/super/tenants - List all tenants with statistics
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const { results } = await db.prepare(`
      SELECT t.id, t.tenant_code, t.name, t.email, t.password_hash, t.expires_at, t.status, 
             t.max_users, t.notes, t.created_at,
             COUNT(u.id) as user_count,
             SUM(CASE WHEN u.is_banned = 1 THEN 1 ELSE 0 END) as banned_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `).all();

    // Map each tenant with live countdown calculations
    const now = Date.now();
    const enriched = (results || []).map((t: any) => {
      const exp = new Date(t.expires_at.replace(' ', 'T') + 'Z').getTime();
      const diffMs = exp - now;
      const isExpired = diffMs <= 0 || t.status === 'expired';
      return {
        ...t,
        is_expired: isExpired,
        remaining_ms: Math.max(0, diffMs),
      };
    });

    return new Response(JSON.stringify({ success: true, tenants: enriched }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/super/tenants - Create new tenant or extend existing tenant
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const body = await context.request.json() as any;
    const { action, tenant_id, tenant_code, name, email, password, days, status, max_users, notes, expires_at } = body;

    // Action: EXTEND / UPDATE EXPIRY
    if (action === 'extend' || action === 'update_expiry') {
      if (!tenant_id) {
        return new Response(JSON.stringify({ error: 'tenant_id is required' }), { status: 400 });
      }

      let newExpiryStr = expires_at;
      if (!newExpiryStr && days) {
        // Add days from current expiry or now
        const current = await db.prepare('SELECT expires_at FROM tenants WHERE id = ?').bind(tenant_id).first() as any;
        const baseTime = current ? Math.max(Date.now(), new Date(current.expires_at.replace(' ', 'T') + 'Z').getTime()) : Date.now();
        const updated = new Date(baseTime + Number(days) * 86400000);
        newExpiryStr = updated.toISOString().replace('T', ' ').substring(0, 19);
      }

      await db.prepare(`
        UPDATE tenants 
        SET expires_at = COALESCE(?, expires_at),
            status = COALESCE(?, status),
            max_users = COALESCE(?, max_users),
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(newExpiryStr || null, status || 'active', max_users || null, notes || null, tenant_id).run();

      return new Response(JSON.stringify({ success: true, message: 'Subscription expiry updated successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Action: CREATE NEW CLIENT ADMIN / TENANT
    if (!tenant_code || !password || !name) {
      return new Response(JSON.stringify({ error: 'Code, Name, and Password are required' }), { status: 400 });
    }

    const durationDays = Number(days) || 30; // default 1 month
    const expiryDate = new Date(Date.now() + durationDays * 86400000).toISOString().replace('T', ' ').substring(0, 19);

    const result = await db.prepare(`
      INSERT INTO tenants (tenant_code, name, email, password_hash, expires_at, status, max_users, notes)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(
      tenant_code.toLowerCase().trim(),
      name.trim(),
      email || `${tenant_code}@client.com`,
      password,
      expiryDate,
      max_users || 100,
      notes || `Initial ${durationDays} days monthly package`
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Client Admin created successfully',
      id: result.meta.last_row_id,
      expires_at: expiryDate
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

// DELETE /api/super/tenants?id=... - Delete tenant
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing tenant id' }), { status: 400 });
    }

    await db.prepare('DELETE FROM users WHERE tenant_id = ?').bind(id).run();
    await db.prepare('DELETE FROM tenants WHERE id = ?').bind(id).run();
    return new Response(JSON.stringify({ success: true, message: 'Tenant deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
