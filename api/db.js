// Koneksi Neon + verifikasi Firebase ID token
const { neon } = require('@neondatabase/serverless');
const admin = require('firebase-admin');

// Inisialisasi Firebase Admin sekali (untuk verifikasi token login)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

const sql = neon(process.env.DATABASE_URL);

// Ambil user dari token yang dikirim browser (header Authorization: Bearer <token>)
async function getUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) throw new Error('NO_TOKEN');
  const decoded = await admin.auth().verifyIdToken(token);
  const email = (decoded.email || '').toLowerCase();
  // ambil profil + config peran dari... (kita simpan users & config di Neon juga nanti;
  // untuk fase ini, kirim peran dari frontend TIDAK aman, jadi kita baca minimal dari token email)
  return { email };
}

// Body JSON aman
async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((res) => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => { try { res(JSON.parse(d||'{}')); } catch { res({}); } });
  });
}

module.exports = { sql, admin, getUser, body };