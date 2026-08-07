const { sql, getUser, body } = require('../_db');

// Daftar kolom dengan alias camelCase supaya cocok dengan gatepass.html.
const COLS = `
  id,
  gp_id            AS "gpId",
  requester_email  AS "requesterEmail",
  requester_name   AS "requesterName",
  department,
  dept_head_emails AS "deptHeadEmails",
  type, purpose, status,
  item_status      AS "itemStatus",
  dept_head_name   AS "deptHeadName",
  finance_name     AS "financeName",
  hr_name          AS "hrName",
  rejected_reason  AS "rejectedReason",
  arsip,
  created_at       AS "createdAt",
  CASE WHEN dept_head_at IS NOT NULL THEN 'APPROVED'
       WHEN status <> 'PENDING_HOD' THEN 'SKIP' ELSE '' END AS "approvalDeptHead",
  CASE WHEN finance_at IS NOT NULL THEN 'APPROVED' ELSE '' END AS "approvalFinance",
  CASE WHEN hr_at IS NOT NULL THEN 'APPROVED' ELSE '' END      AS "approvalHR"
`;

module.exports = async (req, res) => {
  try {
    await getUser(req); // pastikan login valid
    const b = await body(req);
    const scope = b.scope || 'mine';                 // mine|out|pending_hod|pending_finance|pending_hrd|all
    const email = (b.email || '').toLowerCase();
    const limit = Math.min(Number(b.limit) || 15, 50);
    const offset = Number(b.offset) || 0;

    let rows;
    if (scope === 'mine') {
      rows = await sql`SELECT ${sql.unsafe(COLS)} FROM gatepass
        WHERE requester_email=${email} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (scope === 'out') {
      rows = await sql`SELECT ${sql.unsafe(COLS)} FROM gatepass
        WHERE item_status='DI LUAR HOTEL' AND arsip=false AND type IN ('REPAIR','BORROWED') AND status<>'REJECTED'
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (scope === 'pending_hod') {
      rows = await sql`SELECT ${sql.unsafe(COLS)} FROM gatepass
        WHERE status='PENDING_HOD' AND arsip=false AND ${email} = ANY(dept_head_emails)
        ORDER BY created_at DESC`;
    } else if (scope === 'pending_finance') {
      rows = await sql`SELECT ${sql.unsafe(COLS)} FROM gatepass
        WHERE status='PENDING_FINANCE' AND arsip=false ORDER BY created_at DESC`;
    } else if (scope === 'pending_hrd') {
      rows = await sql`SELECT ${sql.unsafe(COLS)} FROM gatepass
        WHERE status='PENDING_HRD' AND arsip=false ORDER BY created_at DESC`;
    } else {
      rows = await sql`SELECT ${sql.unsafe(COLS)} FROM gatepass
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    }

    // Ambil items untuk gatepass yang tampil (camelCase).
    const ids = rows.map((r) => r.id);
    let items = [];
    if (ids.length) {
      items = await sql`SELECT gatepass_id AS "gatepassId", name, qty, unit, description,
        photo_url AS "photoURL" FROM gatepass_items WHERE gatepass_id = ANY(${ids})`;
    }
    const byGp = {};
    items.forEach((it) => { (byGp[it.gatepassId] = byGp[it.gatepassId] || []).push(it); });
    const data = rows.map((r) => ({ ...r, items: byGp[r.id] || [] }));

    res.json({ ok: true, data });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
};
