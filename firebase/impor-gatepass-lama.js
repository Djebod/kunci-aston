/**
 * Impor 41 gate pass lama ke Firestore (koleksi "gatepass") sebagai arsip.
 *
 * Jalankan di folder yang berisi:
 *   - serviceAccountKey.json
 *   - gatepass-lama.json
 *   - file ini
 *
 * Perintah:
 *   npm install firebase-admin
 *   node impor-gatepass-lama.js
 *
 * Aman dijalankan sekali. Kalau dijalankan lagi akan membuat duplikat,
 * jadi cukup SEKALI saja.
 */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const fs = require('fs');

initializeApp({ credential: cert(require('./serviceAccountKey.json')) });
const db = getFirestore();

async function main() {
  const data = JSON.parse(fs.readFileSync('./gatepass-lama.json', 'utf8'));
  console.log('Akan impor', data.length, 'gate pass lama…');
  let n = 0;
  for (const d of data) {
    const follow = (d.type === 'REPAIR' || d.type === 'BORROWED');
    const doc = {
      gpId: d.id,
      createdAt: parseDate(d.date, d.time),
      date: d.date, time: d.time || '',
      type: d.type,
      requesterName: d.requesterName, requesterEmail: (d.requesterEmail || '').toLowerCase(),
      department: (d.department || '').toUpperCase(), purpose: d.purpose || '',
      deptHeadEmails: [],
      items: [{ name: 'Barang (arsip)', qty: 1, unit: 'lot', description: d.purpose || '', photoURL: '' }],
      status: d.status || 'APPROVED',
      itemStatus: d.itemStatus || (follow ? 'DI LUAR HOTEL' : ''),
      approvalDeptHead: 'APPROVED', deptHeadName: d.deptHeadName || '', deptHeadEmail: '', deptHeadRemark: '', deptHeadAt: parseDate(d.deptHeadAt),
      approvalFinance: 'APPROVED', financeName: d.financeName || '', financeEmail: '', financeRemark: '', financeAt: parseDate(d.financeAt),
      approvalHR: 'APPROVED', hrName: d.hrName || '', hrEmail: '', hrRemark: '', hrAt: parseDate(d.hrAt),
      rejectedBy: '', rejectedRole: '', rejectedReason: '', rejectedAt: null,
      arsip: true,
      logs: [{ at: new Date().toISOString(), actor: 'IMPORT', email: '', role: 'SYSTEM', action: 'IMPORT', note: 'arsip data lama' }]
    };
    await db.collection('gatepass').add(doc);
    n++;
    if (n % 10 === 0) console.log('  ', n, 'terimpor…');
  }
  console.log('Selesai. Total', n, 'gate pass lama masuk sebagai arsip.');
}

function parseDate(dateStr, timeStr) {
  if (!dateStr) return null;
  try {
    // format m/d/yyyy atau m/d/yyyy h:mm:ss
    let s = String(dateStr).trim();
    if (timeStr) s += ' ' + timeStr;
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return Timestamp.fromDate(d);
  } catch (e) { return null; }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
