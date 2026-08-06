/**
 * ============================================================
 *  IMPOR DATA → FIRESTORE + BUAT AKUN AUTH
 *  Dijalankan SEKALI dari komputer (Node.js).
 *
 *  Butuh:
 *   1. Node.js terpasang
 *   2. serviceAccountKey.json (Firebase Console →
 *      Project settings → Service accounts → Generate new private key)
 *   3. data-export.json (hasil ekspor dari Apps Script)
 *
 *  Cara pakai (di folder ini):
 *   npm install firebase-admin
 *   node impor-ke-firestore.js
 *
 *  Catatan: memakai gaya "modular" (firebase-admin/app, /auth,
 *  /firestore) supaya kompatibel dengan firebase-admin v12/v13
 *  terbaru. Gaya lama admin.credential.cert() sudah tidak dipakai.
 * ============================================================
 */

const { initializeApp, cert }          = require('firebase-admin/app');
const { getAuth }                       = require('firebase-admin/auth');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');
const data = JSON.parse(fs.readFileSync('./data-export.json', 'utf8'));

// Password awal untuk SEMUA user hasil migrasi.
// Minta mereka menggantinya lewat menu Akun setelah login pertama.
const PASSWORD_AWAL = 'Aston2026!';

// Email super admin utama (pastikan ada di data & dijadikan SUPERADMIN)
const SUPER_ADMIN = 'itm@astoncirebon.com';

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db   = getFirestore();

async function main() {
  console.log('Mulai impor...');
  console.log(`users: ${data.users.length} | keys: ${data.keys.length} | loans: ${data.loans.length}`);

  // ---- 1. USERS: buat akun Auth + dokumen Firestore ----
  let dibuat = 0, adaAuth = 0;
  for (const u of data.users) {
    const email = String(u.email || '').trim().toLowerCase();
    if (!email) continue;

    // buat / pastikan akun Auth
    try {
      await auth.createUser({ email, password: PASSWORD_AWAL, emailVerified: true });
      dibuat++;
    } catch (e) {
      if (e.code === 'auth/email-already-exists') adaAuth++;
      else { console.warn('  gagal buat Auth', email, e.message); }
    }

    // dokumen Firestore users/{email}
    const role = (email === SUPER_ADMIN.toLowerCase()) ? 'SUPERADMIN' : (u.role || 'STAFF');
    await db.collection('users').doc(email).set({
      email, nama: u.nama || '', dept: u.dept || '', role,
      aktif: u.aktif !== false, offDate: null
    });
  }
  console.log(`Users: akun Auth baru ${dibuat}, sudah ada ${adaAuth}, dok Firestore ${data.users.length}`);

  // ---- 2. KEYS ----
  let bk = db.batch(); let n = 0, totalK = 0;
  for (const k of data.keys) {
    const ref = db.collection('keys').doc();
    bk.set(ref, {
      nama: k.nama, kode: k.kode || '', status: k.status || 'TERSEDIA',
      pemegang: k.pemegang || '', email: k.email || '', dept: k.dept || '',
      sejak: k.sejak ? Timestamp.fromDate(new Date(k.sejak)) : null,
      loanId: k.loanId || ''
    });
    if (++n >= 400) { await bk.commit(); bk = db.batch(); n = 0; }
    totalK++;
  }
  if (n > 0) await bk.commit();
  console.log(`Keys: ${totalK} dokumen dibuat`);

  // ---- 3. LOANS (riwayat) ----
  let bl = db.batch(); let m = 0, totalL = 0;
  for (const l of data.loans) {
    const ref = db.collection('loans').doc();
    bl.set(ref, {
      ts: l.ts ? Timestamp.fromDate(new Date(l.ts)) : FieldValue.serverTimestamp(),
      nama: l.nama || '', dept: l.dept || '', status: l.status || '',
      keys: l.keys || [], by: l.by || l.nama || '', byEmail: l.byEmail || '',
      jenis: l.jenis || 'SENDIRI', catatan: l.catatan || '', loanId: l.loanId || ''
    });
    if (++m >= 400) { await bl.commit(); bl = db.batch(); m = 0; }
    totalL++;
  }
  if (m > 0) await bl.commit();
  console.log(`Loans: ${totalL} dokumen dibuat`);

  console.log('\nSELESAI.');
  console.log(`Semua user login dengan password awal: ${PASSWORD_AWAL}`);
  console.log('Minta mereka menggantinya lewat menu Akun setelah login pertama.');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });