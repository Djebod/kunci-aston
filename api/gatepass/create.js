const { sql, getUser, body } = require('../_db');

module.exports = async (req, res) => {
  try {
    const me = await getUser(req);
    const b = await body(req);

    // Header gate pass. requester_email diambil dari token (bukan dari body) = lebih aman.
    const rows = await sql`
      INSERT INTO gatepass (gp_id, requester_email, requester_name, department, dept_head_emails,
        type, purpose, status, item_status)
      VALUES (${b.gpId || ''}, ${me.email}, ${b.requesterName || ''}, ${b.department || ''},
        ${b.deptHeadEmails || []}, ${b.type || ''}, ${b.purpose || ''}, ${b.status || 'PENDING_HOD'},
        ${b.itemStatus || ''})
      RETURNING id`;
    const gid = rows[0].id;

    // Barang (bisa banyak).
    for (const it of (b.items || [])) {
      await sql`INSERT INTO gatepass_items (gatepass_id, name, qty, unit, description, photo_url)
                VALUES (${gid}, ${it.name || ''}, ${Number(it.qty) || 1}, ${it.unit || 'pcs'},
                        ${it.description || ''}, ${it.photoURL || ''})`;
    }

    // Log.
    await sql`INSERT INTO gatepass_log (gatepass_id, actor, actor_email, role, action, note)
              VALUES (${gid}, ${b.requesterName || ''}, ${me.email}, 'STAFF', 'CREATE',
                      ${(b.items || []).length + ' barang'})`;

    res.json({ ok: true, id: gid });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
};
