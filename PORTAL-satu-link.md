# Portal Staff — dua modul dalam satu link

Sekarang kedua aplikasi berjalan di **satu link**. Alurnya:

```
Buka link  →  Login (sekali)  →  Menu pilih modul
                                   ├─ Peminjaman & Pengembalian Kunci
                                   └─ Exit Permit
```

Login cukup **sekali** — sesi dibagi otomatis antar modul (Firebase menyimpan sesi di browser). Pindah modul lewat tombol **‹ Menu** di kiri atas tiap aplikasi.

---

## Struktur file (3 halaman, 1 config)

```
index.html          ← HALAMAN UTAMA: login + menu pilih modul
kunci.html          ← modul Peminjaman & Pengembalian Kunci
permit.html         ← modul Exit Permit
firebase-config.js  ← config Firebase TERPUSAT (isi sekali, dipakai bertiga)
firestore.rules     ← rules gabungan (kunci + permit)
favicon.svg, logo, manifest, dll
```

Link yang dibagikan ke staff = **halaman utama** (`index.html`). Dari situ mereka login lalu memilih modul.

---

## Yang berubah

- **Dulu:** `index.html` = aplikasi kunci. **Sekarang:** aplikasi kunci pindah ke `kunci.html`, dan `index.html` jadi menu.
- **Config Firebase tidak lagi ditulis di tiap file.** Cukup diisi **sekali** di `firebase-config.js`. Ketiga halaman membacanya dari situ.

---

## Setup (ringkas)

### 1. Isi config Firebase — SEKALI saja
Buka **`firebase-config.js`**, ganti nilai `GANTI_...` dengan config project (Firebase Console → ⚙ Project settings → Your apps → Web). Simpan. Selesai — ketiga halaman langsung ikut.

### 2. Publish rules gabungan
Firestore → Rules → tempel `firestore.rules` → Publish. (Sudah mencakup kunci + permit.)

### 3. Impor data permit (kalau belum)
Di folder `firebase/`:
```
node impor-karyawan.js       # database karyawan + Dept Head/HRD
node impor-permit-lama.js    # arsip 987 permit lama
```
(Data kunci sudah diimpor sebelumnya lewat `impor-ke-firestore.js`.)

### 4. Deploy semua file
- **Vercel:** taruh `index.html`, `kunci.html`, `permit.html`, `firebase-config.js`, favicon, logo, manifest di folder `public/`. `git push`.
  - Link staff: `https://namaapp.vercel.app`
- **Firebase Hosting:** `firebase deploy`.
  - Link staff: `https://namaproject.web.app`

### 5. (Vercel) Authorized domains
Firebase → Authentication → Settings → Authorized domains → pastikan domain Vercel ada.

---

## Cara kerja login bersama

Firebase Authentication menyimpan sesi login di browser (per domain). Karena ketiga halaman berada di **domain yang sama** dan memakai **project Firebase yang sama**:

- Login di `index.html` → `kunci.html` & `permit.html` otomatis sudah login.
- Logout di mana pun → semua ikut logout.
- Kalau seseorang membuka `kunci.html`/`permit.html` langsung tanpa login, halaman itu menampilkan form login sendiri sebagai cadangan (lalu tetap bisa jalan).

---

## Siapa melihat apa

Kedua kartu modul muncul untuk **semua** karyawan yang login. Pembatasan peran ada **di dalam** masing-masing modul:
- **Kunci:** tab admin (Kelola Kunci, User, Audit) hanya untuk ADMIN/SUPERADMIN.
- **Permit:** tab Persetujuan untuk Dept Head/HRD; tab Karyawan untuk admin.

Jadi staff biasa tetap melihat dua pilihan, tapi isinya menyesuaikan hak masing-masing.

---

## Uji cepat

1. `npx serve .` di folder `firebase/` → buka `http://localhost:3000`
2. Login super admin → muncul menu 2 kartu
3. Klik **Kunci** → masuk modul kunci (tanpa login lagi) → klik **‹ Menu** → kembali
4. Klik **Exit Permit** → masuk modul permit (tanpa login lagi)
5. Logout → kembali ke halaman login

---

## Checklist

- [ ] `firebase-config.js` sudah diisi (bukan `GANTI_`)
- [ ] `firestore.rules` gabungan sudah Publish
- [ ] `impor-karyawan.js` & `impor-permit-lama.js` sudah dijalankan
- [ ] 4 file HTML/JS + aset ada di hosting
- [ ] Domain ada di Authorized domains (kalau Vercel)
- [ ] Login sekali → bisa buka kedua modul tanpa login ulang
- [ ] Akun login untuk 6 email HOD/HRD sudah dibuat (lihat README-exit-permit.md)

---

## Ringkas

- **Satu link** = `index.html` (menu).
- **Login sekali**, sesi dibagi ke kedua modul.
- **Config diisi sekali** di `firebase-config.js`.
- Modul kunci kini di `kunci.html`, modul izin di `permit.html`, dihubungkan tombol **‹ Menu**.
