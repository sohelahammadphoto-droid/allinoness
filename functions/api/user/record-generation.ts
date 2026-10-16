interface Env {
  DB: D1Database;
}

// POST /api/user/record-generation
// Increments the user's generation_count and logs into generation_history table
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;
    const body = await context.request.json() as any;
    const { user_id, tenant_id, template_code, summary_info } = body;

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Increment generation_count in users table
    await db.prepare(`
      UPDATE users 
      SET generation_count = COALESCE(generation_count, 0) + 1 
      WHERE id = ?
    `).bind(user_id).run();

    // 2. Insert record in generation_history if table exists
    try {
      await db.prepare(`
        INSERT INTO generation_history (tenant_id, user_id, template_code, summary_info)
        VALUES (?, ?, ?, ?)
      `).bind(
        tenant_id || null,
        user_id,
        template_code || 'receipt',
        summary_info || 'Generated receipt via API'
      ).run();
    } catch (histErr) {
      console.warn('Could not write to generation_history:', histErr);
    }

    // 3. Return updated generation count
    const updated = await db.prepare('SELECT generation_count FROM users WHERE id = ?').bind(user_id).first() as any;

    return new Response(JSON.stringify({
      success: true,
      message: 'Generation count recorded',
      generation_count: updated?.generation_count || 1
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
