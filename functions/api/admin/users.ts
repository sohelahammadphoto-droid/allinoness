interface Env {
  DB: D1Database;
}

// GET /api/admin/users?tenant_id=... - List all users for a tenant
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const tenantId = url.searchParams.get('tenant_id') || '1';

    const { results } = await db.prepare(`
      SELECT id, tenant_id, username, password_hash, full_name, is_banned, daily_limit, generation_count, created_at
      FROM users
      WHERE tenant_id = ?
      ORDER BY id DESC
    `).bind(tenantId).all();

    return new Response(JSON.stringify({ success: true, users: results || [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST /api/admin/users - Create new user
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const { tenant_id, username, password, full_name, daily_limit } = await context.request.json() as any;

    if (!tenant_id || !username || !password) {
      return new Response(JSON.stringify({ error: 'Tenant ID, username and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check user limit
    const tenant = await db.prepare('SELECT max_users, expires_at, status FROM tenants WHERE id = ?').bind(tenant_id).first() as any;
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), { status: 404 });
    }

    const expMs = new Date(tenant.expires_at.replace(' ', 'T') + 'Z').getTime();
    if (Date.now() > expMs || tenant.status === 'expired') {
      return new Response(JSON.stringify({ error: 'Your subscription has expired. Please renew to add new users.' }), { status: 403 });
    }

    const userCount = await db.prepare('SELECT COUNT(*) as count FROM users WHERE tenant_id = ?').bind(tenant_id).first() as any;
    if (userCount && userCount.count >= (tenant.max_users || 100)) {
      return new Response(JSON.stringify({ error: `User limit reached (${tenant.max_users} max users allowed)` }), { status: 400 });
    }

    // Insert user
    const res = await db.prepare(`
      INSERT INTO users (tenant_id, username, password_hash, full_name, is_banned, daily_limit)
      VALUES (?, ?, ?, ?, 0, ?)
    `).bind(tenant_id, username.trim(), password.trim(), full_name || username, daily_limit || 500).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'User created successfully',
      user_id: res.meta.last_row_id
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

// PATCH /api/admin/users - Toggle Ban/Unban or update password
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const { user_id, action, is_banned, password } = await context.request.json() as any;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
    }

    if (action === 'toggle_ban' || is_banned !== undefined) {
      const bannedVal = is_banned !== undefined ? (is_banned ? 1 : 0) : 1;
      await db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').bind(bannedVal, user_id).run();
      return new Response(JSON.stringify({ success: true, message: bannedVal ? 'User banned successfully' : 'User unbanned successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reset_password' && password) {
      await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(password, user_id).run();
      return new Response(JSON.stringify({ success: true, message: 'Password reset successfully' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// DELETE /api/admin/users?user_id=... - Delete user
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
    }

    await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
    return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
