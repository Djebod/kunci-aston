/**
 * Pindahkan data gatepass dari Firestore ke Neon (Postgres). Sekali jalan.
 *
 * Taruh file ini di folder yang ada serviceAccountKey.json (mis. firebase/).
 * Jalankan:
 *   npm install firebase-admin @neondatabase/serverless
 *   $env:DATABASE_URL="postgresql://...connection string Neon..."
 *   node migrasi-gatepass-firestore-ke-neon.js
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { neon } = require('@neondatabase/serverless');

initializeApp({ credential: cert(require('./serviceAccountKey.json')) });
const db = getFirestore();
const sql = neon(process.env.DATABASE_URL);

(async () => {
  if (!process.env.DATABASE_URL) { console.error('Set dulu DATABASE_URL'); process.exit(1); }
  const snap = await db.collection('gatepass').get();
  console.log('Ambil', snap.size, 'gate pass dari Firestore…');
  let n = 0;
  for (const doc of snap.docs) {
    const g = doc.data();
    const rows = await sql`
      INSERT INTO gatepass (gp_id, requester_email, requester_name, department, dept_head_emails,
        type, purpose, status, item_status,
        dept_head_name, dept_head_at, finance_name, finance_at, hr_name, hr_at, arsip, created_at)
      VALUES (${g.gpId || ''}, ${(g.requesterEmail || '').toLowerCase()}, ${g.requesterName || ''}, ${g.department || ''},
        ${g.deptHeadEmails || []}, ${g.type || ''}, ${g.purpose || ''}, ${g.status || 'APPROVED'}, ${g.itemStatus || ''},
        ${g.deptHeadName || ''}, ${tsOrNull(g.deptHeadAt)}, ${g.financeName || ''}, ${tsOrNull(g.financeAt)},
        ${g.hrName || ''}, ${tsOrNull(g.hrAt)}, ${g.arsip === true},
        ${g.createdAt && g.createdAt.toDate ? g.createdAt.toDate().toISOString() : new Date().toISOString()})
      RETURNING id`;
    const gid = rows[0].id;
    for (const it of (g.items || [])) {
      await sql`INSERT INTO gatepass_items (gatepass_id, name, qty, unit, description, photo_url)
                VALUES (${gid}, ${it.name || ''}, ${Number(it.qty) || 1}, ${it.unit || 'pcs'},
                        ${it.description || ''}, ${it.photoURL || ''})`;
    }
    // salin log bila ada
    for (const l of (g.logs || [])) {
      await sql`INSERT INTO gatepass_log (gatepass_id, actor, actor_email, role, action, note, created_at)
                VALUES (${gid}, ${l.actor || ''}, ${l.email || ''}, ${l.role || ''}, ${l.action || ''}, ${l.note || ''},
                        ${l.at || new Date().toISOString()})`;
    }
    n++;
    if (n % 10 === 0) console.log('  ', n, 'terpindah…');
  }
  console.log('Selesai. Total', n, 'gate pass dipindah ke Neon.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

function tsOrNull(ts) {
  try { return ts && ts.toDate ? ts.toDate().toISOString() : null; } catch { return null; }
}
