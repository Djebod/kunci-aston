/**
 * Impor data gate pass LAMA dari file JSON lokal → Neon.
 * TIDAK membaca Firestore, jadi TIDAK kena kuota Firestore.
 *
 * Pakai file gatepass-lama.json (array objek gate pass) yang sudah ada.
 * Jalankan:
 *   $env:DATABASE_URL="postgresql://...string asli Neon..."
 *   node impor-json-ke-neon.js gatepass-lama.json
 */
const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);
const file = process.argv[2] || './gatepass-lama.json';

function iso(v) {
  if (!v) return new Date().toISOString();
  if (typeof v === 'string') { const t = Date.parse(v); return isNaN(t) ? new Date().toISOString() : new Date(t).toISOString(); }
  if (v._seconds || v.seconds) return new Date((v._seconds || v.seconds) * 1000).toISOString();
  return new Date().toISOString();
}

(async () => {
  if (!process.env.DATABASE_URL) { console.error('Set dulu DATABASE_URL'); process.exit(1); }
  if (!fs.existsSync(file)) { console.error('File tidak ditemukan:', file); process.exit(1); }

  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const arr = Array.isArray(raw) ? raw : (raw.gatepass || raw.data || []);
  console.log('Baca', arr.length, 'gate pass dari', file);

  let n = 0;
  for (const g of arr) {
    const rows = await sql`
      INSERT INTO gatepass (gp_id, requester_email, requester_name, department, dept_head_emails,
        type, purpose, status, item_status, dept_head_name, finance_name, hr_name, arsip, created_at)
      VALUES (${g.gpId || ''}, ${(g.requesterEmail || '').toLowerCase()}, ${g.requesterName || ''}, ${g.department || ''},
        ${g.deptHeadEmails || []}, ${g.type || ''}, ${g.purpose || ''}, ${g.status || 'APPROVED'}, ${g.itemStatus || ''},
        ${g.deptHeadName || ''}, ${g.financeName || ''}, ${g.hrName || ''}, ${g.arsip === true}, ${iso(g.createdAt)})
      RETURNING id`;
    const gid = rows[0].id;

    for (const it of (g.items || [])) {
      await sql`INSERT INTO gatepass_items (gatepass_id, name, qty, unit, description, photo_url)
                VALUES (${gid}, ${it.name || ''}, ${Number(it.qty) || 1}, ${it.unit || 'pcs'},
                        ${it.description || ''}, ${it.photoURL || it.photo_url || ''})`;
    }
    for (const l of (g.logs || [])) {
      await sql`INSERT INTO gatepass_log (gatepass_id, actor, actor_email, role, action, note, created_at)
                VALUES (${gid}, ${l.actor || ''}, ${l.email || ''}, ${l.role || ''}, ${l.action || ''}, ${l.note || ''},
                        ${l.at || new Date().toISOString()})`;
    }
    n++;
    if (n % 10 === 0) console.log('  ', n, 'diimpor…');
  }
  console.log('Selesai. Total', n, 'gate pass diimpor ke Neon.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
