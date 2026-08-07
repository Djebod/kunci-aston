# Paket Gate Pass → Neon (siap copas)

Isi ZIP ini punya struktur folder yang sama dengan repo Anda. Cukup **gabungkan** (copy–paste) ke `D:\kunci-aston-vercel\`.

## Struktur & tujuan tiap file
```
gatepass-neon-paket\
├─ api\
│  ├─ _db.js                         → copy ke  D:\kunci-aston-vercel\api\_db.js
│  └─ gatepass\
│     ├─ list.js                     → copy ke  api\gatepass\list.js
│     ├─ create.js                   → copy ke  api\gatepass\create.js
│     ├─ approve.js                  → copy ke  api\gatepass\approve.js
│     ├─ reject.js                   → copy ke  api\gatepass\reject.js
│     └─ itemStatus.js               → copy ke  api\gatepass\itemStatus.js
├─ public\
│  └─ gatepass.html                  → TIMPA    public\gatepass.html
├─ package.json                      → gabungkan "dependencies"-nya
├─ .env.example                      → acuan env var (nilai asli diisi di Vercel)
├─ 1-buat-tabel-NEON.sql             → tempel ke Neon SQL Editor → Run (SUDAH beres = boleh dilewati)
└─ migrasi-gatepass-firestore-ke-neon.js → OPSIONAL, dijalankan `node` untuk pindah data lama
```

> Cara termudah copas di Windows: buka folder `gatepass-neon-paket`, pilih `api` dan `public` dan `package.json`, salin, lalu tempel ke `D:\kunci-aston-vercel\` → pilih **"Replace the files in the destination"** untuk `gatepass.html`, dan **"Merge"** untuk folder `api`.

## Langkah pasang (ringkas)
1. **Tabel Neon** — kalau `SELECT COUNT(*) FROM gatepass;` sudah mengembalikan angka, tabel sudah ada → lewati. Kalau belum, tempel `1-buat-tabel-NEON.sql` ke Neon SQL Editor → Run.
2. **Copy file** sesuai struktur di atas, lalu:
   ```powershell
   cd D:\kunci-aston-vercel
   npm install
   ```
3. **Env var di Vercel** (Settings → Environment Variables), centang semua environment:
   - `DATABASE_URL` = connection string Neon
   - `FIREBASE_PROJECT_ID` = `aston-cirebon`
   - `FIREBASE_SERVICE_ACCOUNT` = seluruh isi `serviceAccountKey.json`
4. **Deploy**:
   ```powershell
   git add .
   git commit -m "Gate Pass pindah ke Neon (Postgres) + Vercel Functions"
   git push
   ```
5. **Uji** — buka Gate Pass → Ajukan 1 gate pass (dengan foto) → cek di Neon:
   ```sql
   SELECT id, gp_id, requester_name, status FROM gatepass ORDER BY id DESC LIMIT 5;
   ```

## Penting
- File `.js` di folder `api/` dijalankan Vercel (server). **Jangan** ditempel ke SQL Editor.
- File `.sql` untuk Neon SQL Editor. **Jangan** dijalankan pakai `node`.
- `serviceAccountKey.json` tetap rahasia — jangan commit. Untuk Vercel, isinya ditaruh di env var `FIREBASE_SERVICE_ACCOUNT`.
- Yang masih pakai Firebase (sengaja): login (Auth), profil/peran (users & config di Firestore), dan foto (Google Drive).

Kalau error saat Ajukan: Vercel → Deployments → (terbaru) → Functions → Logs.
