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

    const db = context.env.DB;

    // 1. Super Admin Login
    if (role === 'superadmin' || role === 'super_admin') {
      const superAdmin = await db.prepare(
        'SELECT id, username, name FROM super_admins WHERE username = ? AND password_hash = ?'
      ).bind(username, password).first();

      if (!superAdmin) {
        return new Response(JSON.stringify({ error: 'Invalid Super Admin credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

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

    // 2. Client Admin (Tenant) Login
    if (role === 'client_admin' || role === 'tenant') {
      const tenant = await db.prepare(
        'SELECT id, tenant_code, name, email, expires_at, status, max_users FROM tenants WHERE (tenant_code = ? OR email = ?) AND password_hash = ?'
      ).bind(username, username, password).first() as any;

      if (!tenant) {
        return new Response(JSON.stringify({ error: 'Invalid Admin credentials' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const expiresDate = new Date(tenant.expires_at.replace(' ', 'T') + 'Z');
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

    // 3. End User Login (or auto-detect)
    // Check if user is in users table
    const endUser = await db.prepare(
      `SELECT u.id, u.tenant_id, u.username, u.full_name, u.is_banned, u.daily_limit, 
              t.expires_at as tenant_expires_at, t.status as tenant_status, t.name as tenant_name
       FROM users u
       JOIN tenants t ON u.tenant_id = t.id
       WHERE u.username = ? AND u.password_hash = ?`
    ).bind(username, password).first() as any;

    if (endUser) {
      if (endUser.is_banned === 1) {
        return new Response(JSON.stringify({ error: 'Your account has been suspended by your administrator.' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const tenantExpiresDate = new Date(endUser.tenant_expires_at.replace(' ', 'T') + 'Z');
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

    // Fallback: Check if they are Super Admin or Tenant if role was not specified
    const checkSA = await db.prepare(
      'SELECT id, username, name FROM super_admins WHERE username = ? AND password_hash = ?'
    ).bind(username, password).first();

    if (checkSA) {
      return new Response(JSON.stringify({
        token: `sa_${checkSA.id}_${Date.now()}`,
        role: 'superadmin',
        user: checkSA
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const checkTenant = await db.prepare(
      'SELECT id, tenant_code, name, email, expires_at, status, max_users FROM tenants WHERE (tenant_code = ? OR email = ?) AND password_hash = ?'
    ).bind(username, username, password).first() as any;

    if (checkTenant) {
      const expiresDate = new Date(checkTenant.expires_at.replace(' ', 'T') + 'Z');
      const isExpired = Date.now() > expiresDate.getTime() || checkTenant.status === 'expired';
      return new Response(JSON.stringify({
        token: `ca_${checkTenant.id}_${Date.now()}`,
        role: 'client_admin',
        isExpired,
        tenant: {
          ...checkTenant,
          status: isExpired ? 'expired' : checkTenant.status
        }
      }), { headers: { 'Content-Type': 'application/json' } });
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
