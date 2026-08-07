const { sql, getUser, body } = require('../_db');

module.exports = async (req, res) => {
  try {
    const me = await getUser(req);
    const b = await body(req);
    const id = Number(b.id);

    const cur = (await sql`SELECT status, dept_head_emails FROM latepermit WHERE id=${id}`)[0];
    if (!cur) throw new Error('Data tidak ditemukan.');
    if (cur.status !== 'PENDING_HOD') throw new Error('Sudah diproses.');
    const heads = (cur.dept_head_emails || []).map((x) => String(x).toLowerCase());
    if (heads.length && !heads.includes(me.email)) throw new Error('Anda bukan Dept Head pengaju ini.');

    await sql`UPDATE latepermit SET status='REJECTED',
      rejected_by=${b.actorName || ''}, rejected_reason=${b.note || ''}, rejected_at=now(),
      dept_head_email=${me.email}
      WHERE id=${id}`;

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
};
