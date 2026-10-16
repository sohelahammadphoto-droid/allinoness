interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const db = context.env.DB;

    // Fetch active templates and custom services
    const { results: templates } = await db.prepare(
      'SELECT id, code, name, icon, color, is_active, sort_order FROM templates WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();

    const { results: services } = await db.prepare(
      'SELECT id, service_key as code, name, icon_val as icon, bg_color as color, is_active, sort_order FROM services WHERE is_active = 1 ORDER BY sort_order ASC'
    ).all();

    // Fetch all template fields
    const { results: fields } = await db.prepare(
      'SELECT id, template_code, field_key, field_label, field_type, default_value, placeholder, options_json, is_required, section, sort_order FROM template_fields ORDER BY sort_order ASC'
    ).all();

    const allTemplates = [...(templates || [])];
    (services || []).forEach((srv: any) => {
      if (!allTemplates.some((t: any) => t.code === srv.code)) {
        allTemplates.push(srv);
      }
    });

    // Group fields by template / service code
    const templatesWithFields = allTemplates.map((tpl: any) => {
      const tplFields = (fields || [])
        .filter((f: any) => f.template_code === tpl.code)
        .map((f: any) => ({
          ...f,
          options: f.options_json ? JSON.parse(f.options_json) : null,
        }));

      return {
        ...tpl,
        fields: tplFields,
      };
    });

    return new Response(JSON.stringify({ success: true, templates: templatesWithFields }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
