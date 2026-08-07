const { sql, getUser, body } = require('../_db');

module.exports = async (req, res) => {
  try {
    const me = await getUser(req);
    const b = await body(req);

    const rows = await sql`
      INSERT INTO latepermit (ext_id, requester_email, requester_name, department, level, dept_head_emails,
        late_date, late_time, shift, reason, duration, photo_url, status)
      VALUES (${b.extId || ''}, ${me.email}, ${b.requesterName || ''}, ${b.department || ''}, ${b.level || ''},
        ${b.deptHeadEmails || []}, ${b.lateDate || null}, ${b.lateTime || ''}, ${b.shift || ''},
        ${b.reason || ''}, ${b.duration || ''}, ${b.photoURL || ''}, 'PENDING_HOD')
      RETURNING id`;

    res.json({ ok: true, id: rows[0].id });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
};
