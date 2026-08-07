const { sql, getUser, body } = require('../_db');

module.exports = async (req, res) => {
  try {
    const me = await getUser(req);
    const b = await body(req);
    const id = Number(b.id);

    await sql`UPDATE gatepass SET item_status=${b.itemStatus || ''} WHERE id=${id}`;

    await sql`INSERT INTO gatepass_log (gatepass_id, actor, actor_email, role, action, note)
              VALUES (${id}, ${b.actorName || ''}, ${me.email}, ${b.role || ''}, 'ITEM_STATUS', ${b.itemStatus || ''})`;

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
};
