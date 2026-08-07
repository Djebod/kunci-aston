const { sql, getUser, body } = require('../_db');

module.exports = async (req, res) => {
  try {
    const me = await getUser(req);
    const b = await body(req);
    const id = Number(b.id);

    const cur = (await sql`SELECT status, dept_head_emails FROM latepermit WHERE id=${id}`)[0];
    if (!cur) throw new Error('Data tidak ditemukan.');
    if (cur.status !== 'PENDING_HOD') throw new Error('Sudah diproses.');

    // Keamanan: hanya dept head departemen terkait yang boleh menyetujui.
    const heads = (cur.dept_head_emails || []).map((x) => String(x).toLowerCase());
    if (heads.length && !heads.includes(me.email)) throw new Error('Anda bukan Dept Head pengaju ini.');

    await sql`UPDATE latepermit SET status='APPROVED',
      dept_head_name=${b.actorName || ''}, dept_head_email=${me.email},
      dept_head_remark=${b.note || ''}, dept_head_sign=${b.sign || ''}, dept_head_at=now()
      WHERE id=${id}`;

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
};
