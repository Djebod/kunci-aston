const { sql, getUser, body } = require('../_db');

// Ubah baris snake_case dari Postgres → objek camelCase yang dipakai gatepass.html.
function mapRow(r) {
  return {
    id: r.id,
    gpId: r.gp_id,
    requesterEmail: r.requester_email,
    requesterName: r.requester_name,
    department: r.department,
    deptHeadEmails: r.dept_head_emails || [],
    type: r.type,
    purpose: r.purpose,
    status: r.status,
    itemStatus: r.item_status || '',
    deptHeadName: r.dept_head_name || '',
    financeName: r.finance_name || '',
    hrName: r.hr_name || '',
    rejectedReason: r.rejected_reason || '',
    arsip: r.arsip === true,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    approvalDeptHead: r.dept_head_at ? 'APPROVED' : (r.status !== 'PENDING_HOD' ? 'SKIP' : ''),
    approvalFinance: r.finance_at ? 'APPROVED' : '',
    approvalHR: r.hr_at ? 'APPROVED' : ''
  };
}

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
      rows = await sql`SELECT * FROM gatepass
        WHERE requester_email=${email} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (scope === 'out') {
      rows = await sql`SELECT * FROM gatepass
        WHERE item_status='DI LUAR HOTEL' AND arsip=false AND type IN ('REPAIR','BORROWED') AND status<>'REJECTED'
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (scope === 'pending_hod') {
      rows = await sql`SELECT * FROM gatepass
        WHERE status='PENDING_HOD' AND arsip=false AND ${email} = ANY(dept_head_emails)
        ORDER BY created_at DESC`;
    } else if (scope === 'pending_finance') {
      rows = await sql`SELECT * FROM gatepass
        WHERE status='PENDING_FINANCE' AND arsip=false ORDER BY created_at DESC`;
    } else if (scope === 'pending_hrd') {
      rows = await sql`SELECT * FROM gatepass
        WHERE status='PENDING_HRD' AND arsip=false ORDER BY created_at DESC`;
    } else {
      rows = await sql`SELECT * FROM gatepass
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    }

    const data = rows.map(mapRow);

    // Ambil items untuk gatepass yang tampil, lalu tempelkan (camelCase).
    const ids = data.map((r) => r.id);
    if (ids.length) {
      const items = await sql`SELECT * FROM gatepass_items WHERE gatepass_id = ANY(${ids})`;
      const byGp = {};
      items.forEach((it) => {
        const obj = {
          id: it.id, name: it.name, qty: it.qty, unit: it.unit,
          description: it.description || '', photoURL: it.photo_url || ''
        };
        (byGp[it.gatepass_id] = byGp[it.gatepass_id] || []).push(obj);
      });
      data.forEach((r) => { r.items = byGp[r.id] || []; });
    } else {
      data.forEach((r) => { r.items = []; });
    }

    res.json({ ok: true, data });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
};
