interface Env {
  DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { username, password, role } = await context.request.json() as any;

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();
    const db = context.env.DB;

    // 1. Check Super Admin Table First
    const superAdmin = await db.prepare(
      'SELECT id, username, name FROM super_admins WHERE username = ? AND password_hash = ?'
    ).bind(cleanUser, cleanPass).first();

    if (superAdmin) {
      return new Response(JSON.stringify({
        token: `sa_${superAdmin.id}_${Date.now()}`,
        role: 'superadmin',
        user: {
          id: superAdmin.id,
          username: superAdmin.username,
          name: superAdmin.name,
        }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Check Client Admin (Tenants) Table
    const tenant = await db.prepare(
      'SELECT id, tenant_code, name, email, expires_at, status, max_users FROM tenants WHERE (tenant_code = ? OR email = ?) AND password_hash = ?'
    ).bind(cleanUser, cleanUser, cleanPass).first() as any;

    if (tenant) {
      const expiresDate = new Date(tenant.expires_at.replace(' ', 'T') + (tenant.expires_at.endsWith('Z') ? '' : 'Z'));
      const isExpired = Date.now() > expiresDate.getTime() || tenant.status === 'expired';

      return new Response(JSON.stringify({
        token: `ca_${tenant.id}_${Date.now()}`,
        role: 'client_admin',
        isExpired,
        tenant: {
          id: tenant.id,
          tenant_code: tenant.tenant_code,
          name: tenant.name,
          email: tenant.email,
          expires_at: tenant.expires_at,
          status: isExpired ? 'expired' : tenant.status,
          max_users: tenant.max_users,
        }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Check End Users Table
    const endUser = await db.prepare(
      `SELECT u.id, u.tenant_id, u.username, u.full_name, u.is_banned, u.daily_limit, 
              t.expires_at as tenant_expires_at, t.status as tenant_status, t.name as tenant_name
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.username = ? AND u.password_hash = ?`
    ).bind(cleanUser, cleanPass).first() as any;

    if (endUser) {
      if (endUser.is_banned === 1) {
        return new Response(JSON.stringify({ error: 'Your account has been suspended by your administrator.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const tenantExpiresDate = new Date(endUser.tenant_expires_at.replace(' ', 'T') + (endUser.tenant_expires_at.endsWith('Z') ? '' : 'Z'));
      if (Date.now() > tenantExpiresDate.getTime() || endUser.tenant_status === 'expired') {
        return new Response(JSON.stringify({ error: 'Organization subscription has expired. Please contact your admin.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        token: `usr_${endUser.id}_${Date.now()}`,
        role: 'user',
        user: {
          id: endUser.id,
          tenant_id: endUser.tenant_id,
          tenant_name: endUser.tenant_name,
          username: endUser.username,
          full_name: endUser.full_name,
        }
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid username or password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
