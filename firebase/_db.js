// Helper: koneksi Neon (PostgreSQL) + verifikasi Firebase ID token.
// Dipakai oleh semua function di api/gatepass/*.js
const { neon } = require('@neondatabase/serverless');
const admin = require('firebase-admin');

// Inisialisasi Firebase Admin sekali (untuk verifikasi token login).
// FIREBASE_SERVICE_ACCOUNT = seluruh isi serviceAccountKey.json (disimpan di Vercel Env Var).
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  });
}

// Koneksi Neon. DATABASE_URL disimpan di Vercel Env Var (rahasia).
const sql = neon(process.env.DATABASE_URL);

// Verifikasi token yang dikirim browser (header: Authorization: Bearer <idToken>).
// Mengembalikan { email } bila valid; melempar error bila tidak.
async function getUser(req) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) throw new Error('NO_TOKEN');
  const decoded = await admin.auth().verifyIdToken(token);
  return { email: (decoded.email || '').toLowerCase() };
}

// Baca body JSON dengan aman (Vercel biasanya sudah mem-parse req.body).
async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => (d += c));
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}

module.exports = { sql, admin, getUser, body };
