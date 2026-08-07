const { sql, getUser, body } = require('../_db');

function mapRow(r) {
  return {
    id: r.id,
    extId: r.ext_id || '',
    requesterEmail: r.requester_email,
    requesterName: r.requester_name,
    department: r.department,
    level: r.level || '',
    deptHeadEmails: r.dept_head_emails || [],
    lateDate: r.late_date ? new Date(r.late_date).toISOString().slice(0, 10) : '',
    lateTime: r.late_time || '',
    shift: r.shift || '',
    reason: r.reason || '',
    duration: r.duration || '',
    photoURL: r.photo_url || '',
    status: r.status,
    deptHeadName: r.dept_head_name || '',
    deptHeadRemark: r.dept_head_remark || '',
    deptHeadSign: r.dept_head_sign || '',
    rejectedBy: r.rejected_by || '',
    rejectedReason: r.rejected_reason || '',
    arsip: r.arsip === true,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null
  };
}

module.exports = async (req, res) => {
  try {
    await getUser(req);
    const b = await body(req);
    const scope = b.scope || 'mine';               // mine | pending | all
    const email = (b.email || '').toLowerCase();
    const limit = Math.min(Number(b.limit) || 15, 50);
    const offset = Number(b.offset) || 0;

    let rows;
    if (scope === 'mine') {
      rows = await sql`SELECT * FROM latepermit
        WHERE requester_email=${email} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    } else if (scope === 'pending') {
      // Dept Head: hanya departemennya (email tercatat di dept_head_emails), status menunggu
      rows = await sql`SELECT * FROM latepermit
        WHERE status='PENDING_HOD' AND arsip=false AND ${email} = ANY(dept_head_emails)
        ORDER BY created_at DESC`;
    } else {
      rows = await sql`SELECT * FROM latepermit
        ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    }

    res.json({ ok: true, data: rows.map(mapRow) });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
};
