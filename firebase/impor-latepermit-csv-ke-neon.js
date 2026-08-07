/**
 * Impor CSV Late Permit lama → tabel latepermit di Neon.
 * Kolom CSV: ID,Date,Time,Nama,Email,Department,Level,Shift Actual,
 *            Alasan Terlambat,Estimasi Durasi Terlambat,Foto,
 *            Departement Head Approval,Dept Head Sign
 *
 * Jalankan:
 *   $env:DATABASE_URL="postgresql://...string asli Neon..."
 *   node impor-latepermit-csv-ke-neon.js "Official_Employee_Permit_-_Late_Permit.csv"
 */
const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);
const file = process.argv[2] || './Official_Employee_Permit_-_Late_Permit.csv';

// Parser CSV (dukung tanda kutip & koma/kutip ganda di dalam field).
function parseCSV(text) {
  const rows = []; let field = '', row = [], inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// "8/21/2024" -> "2024-08-21"
function toISODate(s) {
  if (!s) return null;
  const m = String(s).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) { const t = Date.parse(s); return isNaN(t) ? null : new Date(t).toISOString().slice(0, 10); }
  const mm = m[1].padStart(2, '0'), dd = m[2].padStart(2, '0'), yyyy = m[3];
  return `${yyyy}-${mm}-${dd}`;
}
function mapStatus(s) {
  const v = String(s || '').trim().toUpperCase();
  if (v === 'APPROVED') return 'APPROVED';
  if (v === 'REJECT' || v === 'REJECTED') return 'REJECTED';
  return 'PENDING_HOD'; // WAITING APPROVAL / kosong
}

(async () => {
  if (!process.env.DATABASE_URL) { console.error('Set dulu DATABASE_URL'); process.exit(1); }
  if (!fs.existsSync(file)) { console.error('File tidak ditemukan:', file); process.exit(1); }

  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCSV(text).filter(r => r.length && r.some(x => String(x).trim() !== ''));
  const header = rows[0];
  console.log('Header:', header.join(' | '));
  const data = rows.slice(1);
  console.log('Baca', data.length, 'baris dari', file);

  let n = 0;
  for (const r of data) {
    // urutan kolom sesuai header
    const [extId, date, time, nama, email, dept, level, shift, alasan, durasi, foto, approval, sign] = r;
    if (!email && !nama) continue;
    const status = mapStatus(approval);
    const createdISO = (toISODate(date) || new Date().toISOString().slice(0, 10)) + 'T00:00:00Z';

    await sql`
      INSERT INTO latepermit (ext_id, requester_email, requester_name, department, level, dept_head_emails,
        late_date, late_time, shift, reason, duration, photo_url, status,
        dept_head_sign, arsip, created_at)
      VALUES (${extId || ''}, ${String(email || '').toLowerCase()}, ${nama || ''}, ${dept || ''}, ${level || ''},
        ${[]}, ${toISODate(date)}, ${time || ''}, ${shift || ''}, ${alasan || ''}, ${durasi || ''},
        ${foto || ''}, ${status}, ${sign || ''}, ${true}, ${createdISO})`;
    n++;
    if (n % 25 === 0) console.log('  ', n, 'diimpor…');
  }
  console.log('Selesai. Total', n, 'late permit diimpor ke Neon.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });