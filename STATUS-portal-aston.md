# Status Portal Aston Cirebon — ringkasan

Password `syam.rakhmany@gmail.com` berhasil di-set langsung via skrip. ✅

Berikut peta lengkap di mana posisi project sekarang.

---

## Sudah selesai ✅

- **Migrasi penuh ke Firebase** (Firestore + Auth), project `aston-cirebon`, owner `itm@astoncirebon.com`
- **Data terimpor**: 233 karyawan, kunci, 987 permit lama (arsip)
- **Portal satu link** dengan login sekali → 3 kartu berwarna:
  - Peminjaman & Pengembalian Kunci (`kunci.html`)
  - Exit Permit (`permit.html`)
  - Manage User (`manageuser.html`) — hanya Super Admin / Admin / HRD
- **Exit Permit**: alur Request → Dept Head → HRD (+ bypass HRD), per departemen, arsip terpisah
- **Manage User**: kelola karyawan, email, role, status, reset PW, atur Dept Head/HRD
- **UI**: loading page, tombol lihat password, retype password, tombol Menu/Keluar berbentuk pill
- **Permit Saya** urut terbaru → terlama
- **Config Firebase terpusat** di `firebase-config.js`
- **Password admin** (`syam.rakhmany@gmail.com`) sudah di-reset via skrip

---

## Sisa tugas ⚠️

### 1. Notifikasi email Exit Permit (belum aktif)
Pasang Apps Script email relay lalu isi `EMAIL_API` di `permit.html`.
→ Panduan: `EMAIL-permit-setup.md`

### 2. Akun login untuk 6 email HOD/HRD
`fc@`, `ca@`, `fbm@`, `ehk@`, `hrm@`, `hra@` (@astoncirebon.com) — belum punya akun.
→ Buat lewat Manage User → + Karyawan, atau skrip massal (lihat bawah).

### 3. Perbaiki 4 email karyawan yang salah format
Data ada, tapi akun login belum (email ada spasi / kurang .com):
`althaffigoghifari @gmail.com`, `kahfi aziemnur17@gmail.com`, `ardhinag@gmail com`, `xzidanssaputra21@gmail`
→ Perbaiki lewat Manage User → Edit (kolom email bisa diubah, akun login otomatis dibuat).

### 4. Keamanan (opsional tapi dianjurkan)
- Batasi API key ke domain (Google Cloud Console)
- Tutup alert "secret detected" di GitHub sebagai "Won't fix"
→ Panduan: `GITHUB-secret-alert.md`, `KEAMANAN-apikey.md`

---

## Set password akun lain (tanpa email)

Untuk akun mana pun yang sudah ada di Authentication, set password langsung:

1. Buka `reset-password.js`, ubah `EMAIL` dan `PASSWORD_BARU`
2. `node reset-password.js` → BERHASIL

Kalau mau menyetel password **beberapa akun sekaligus** (mis. 6 HOD/HRD + 4 email diperbaiki), tinggal minta — saya buatkan `set-password-massal.js`.

---

## Alamat file penting

| File | Fungsi |
|---|---|
| `index.html` | Menu utama (hub 3 kartu) |
| `kunci.html` | Modul peminjaman kunci |
| `permit.html` | Modul Exit Permit |
| `manageuser.html` | Kelola user (super/admin/HRD) |
| `firebase-config.js` | Config Firebase (isi sekali) |
| `firestore.rules` | Aturan keamanan (publish di Console) |
| `email-permit.gs` | Relay email Exit Permit (Apps Script) |
| `reset-password.js` | Set password langsung (Admin SDK) |

---

## Urutan deploy standar (setiap ada perubahan)

```powershell
cd D:\kunci-aston-vercel
Copy-Item firebase\index.html      public\index.html      -Force
Copy-Item firebase\kunci.html      public\kunci.html      -Force
Copy-Item firebase\permit.html     public\permit.html     -Force
Copy-Item firebase\manageuser.html public\manageuser.html -Force
Copy-Item firebase\firebase-config.js public\firebase-config.js -Force
git add .
git commit -m "update"
git push
```
Lalu buka link → Ctrl+Shift+R. Jangan pernah push `serviceAccountKey.json`.

---

Portal sudah berjalan dan bisa dipakai. Sisa tugas di atas bisa dikerjakan bertahap sesuai prioritas. Kalau ada yang mau dilanjutkan, tinggal sebutkan.
