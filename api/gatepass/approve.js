const { sql, getUser, body } = require('../_db');

module.exports = async (req, res) => {
  try {
    const me = await getUser(req);
    const b = await body(req);
    const id = Number(b.id);
    const role = b.role;              // 'HOD' | 'FINANCE' | 'HRD'
    const name = b.actorName || '';
    const note = b.note || '';

    const cur = (await sql`SELECT status, finance_at FROM gatepass WHERE id=${id}`)[0];
    if (!cur) throw new Error('Data tidak ditemukan.');

    if (role === 'HOD') {
      if (cur.status !== 'PENDING_HOD') throw new Error('Sudah diproses pihak lain.');
      await sql`UPDATE gatepass SET status='PENDING_FINANCE',
        dept_head_name=${name}, dept_head_email=${me.email}, dept_head_remark=${note}, dept_head_at=now()
        WHERE id=${id}`;
    } else if (role === 'FINANCE') {
      if (cur.status !== 'PENDING_FINANCE') throw new Error('Dept Head belum menyetujui / sudah diproses.');
      await sql`UPDATE gatepass SET status='PENDING_HRD',
        finance_name=${name}, finance_email=${me.email}, finance_remark=${note}, finance_at=now()
        WHERE id=${id}`;
    } else if (role === 'HRD') {
      if (cur.status !== 'PENDING_HRD') throw new Error('Belum tahap HRD.');
      if (!cur.finance_at) throw new Error('HRD tidak bisa bypass Finance.'); // wajib Finance dulu
      await sql`UPDATE gatepass SET status='APPROVED',
        hr_name=${name}, hr_email=${me.email}, hr_remark=${note}, hr_at=now()
        WHERE id=${id}`;
    } else {
      throw new Error('Role tidak valid.');
    }

    await sql`INSERT INTO gatepass_log (gatepass_id, actor, actor_email, role, action, note)
              VALUES (${id}, ${name}, ${me.email}, ${role}, 'APPROVE', ${note})`;

    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
};
