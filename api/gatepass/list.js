const { sql, getUser, body } = require('../_db');

module.exports = async (req, res) => {
  try {
    await getUser(req); // pastikan login valid
    const b = await body(req);
    const scope = b.scope || 'mine';       // mine | pending | out | all
    const email = (b.email || '').toLowerCase();
    const limit = Math.min(Number(b.limit) || 15, 50);
    const offset = Number(b.offset) || 0;

    let rows;
    if (scope === 'mine') {
      rows = await sql`SELECT * FROM gatepass WHERE requester_email=${email}
                       ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (scope === 'out') {
      rows = await sql`SELECT * FROM gatepass WHERE item_status='DI LUAR HOTEL' AND arsip=false
                       AND type IN ('REPAIR','BORROWED') AND status<>'REJECTED'
                       ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (scope === 'pending_hod') {
      rows = await sql`SELECT * FROM gatepass WHERE status='PENDING_HOD' AND arsip=false
                       AND ${email} = ANY(dept_head_emails) ORDER BY created_at DESC`;
    } else if (scope === 'pending_finance') {
      rows = await sql`SELECT * FROM gatepass WHERE status='PENDING_FINANCE' AND arsip=false ORDER BY created_at DESC`;
    } else if (scope === 'pending_hrd') {
      rows = await sql`SELECT * FROM gatepass WHERE status='PENDING_HRD' AND arsip=false ORDER BY created_at DESC`;
    } else { // all (paginasi)
      rows = await sql`SELECT * FROM gatepass ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    }

    // ambil items utk gatepass yg tampil
    const ids = rows.map(r => r.id);
    let items = [];
    if (ids.length) items = await sql`SELECT * FROM gatepass_items WHERE gatepass_id = ANY(${ids})`;
    const byGp = {};
    items.forEach(it => { (byGp[it.gatepass_id] = byGp[it.gatepass_id] || []).push(it); });
    const data = rows.map(r => ({ ...r, items: byGp[r.id] || [] }));

    res.json({ ok: true, data });
  } catch (e) { res.status(400).json({ ok: false, error: String(e.message||e) }); }
};