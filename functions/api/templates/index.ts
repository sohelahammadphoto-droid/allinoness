interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;

    // Only return user-created dynamic services from services table
    const { results: services } = await db.prepare(
      'SELECT id, service_key as code, name, icon_val as icon, bg_color as color, is_active, sort_order FROM services WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();

    // Fetch all dynamic fields
    const { results: fields } = await db.prepare(
      'SELECT id, template_code, field_key, field_label, field_type, default_value, placeholder, options_json, is_required, section, sort_order FROM template_fields ORDER BY sort_order ASC'
    ).all();

    // Group fields by dynamic service code
    const servicesWithFields = (services || []).map((srv: any) => {
      const srvFields = (fields || [])
        .filter((f: any) => f.template_code === srv.code)
        .map((f: any) => ({
          ...f,
          options: f.options_json ? JSON.parse(f.options_json) : null,
        }));

      return {
        ...srv,
        fields: srvFields,
      };
    });

    return new Response(JSON.stringify({ success: true, templates: servicesWithFields }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
