interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const url = new URL(context.request.url);
    const tenantId = url.searchParams.get('tenant_id') || '1';

    const tenant = await db.prepare(`
      SELECT id, tenant_code, name, email, expires_at, status, max_users, notes, created_at
      FROM tenants
      WHERE id = ?
    `).bind(tenantId).first() as any;

    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expMs = new Date(tenant.expires_at.replace(' ', 'T') + 'Z').getTime();
    const now = Date.now();
    const remainingMs = Math.max(0, expMs - now);
    const isExpired = remainingMs <= 0 || tenant.status === 'expired';

    // Also get current user count
    const stats = await db.prepare(`
      SELECT COUNT(*) as total_users,
             SUM(CASE WHEN is_banned = 1 THEN 1 ELSE 0 END) as banned_users
      FROM users
      WHERE tenant_id = ?
    `).bind(tenantId).first() as any;

    return new Response(JSON.stringify({
      success: true,
      tenant: {
        ...tenant,
        is_expired: isExpired,
        remaining_ms: remainingMs,
        expires_timestamp: expMs,
        stats: {
          total_users: stats?.total_users || 0,
          banned_users: stats?.banned_users || 0,
        }
      }
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
