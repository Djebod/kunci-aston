# Lanjutan — kode sudah di GitHub, sekarang hubungkan ke Vercel

Kode `Djebod/kunci-aston` sudah naik. Sisa 3 bagian: siapkan API di Apps Script → import ke Vercel → colok kredensial. Semua lewat website, tanpa terminal lagi.

---

## BAGIAN A — Apps Script (siapkan API + secret)

Kerjakan ini di project Apps Script yang sudah berisi `Code.gs` + `Index`.

- [ ] **A1.** File → + → Script → beri nama `ApiEndpoint` → tempel isi `ApiEndpoint.gs`
- [ ] **A2.** Pilih fungsi **`buatApiSecret`** → **Run** → izinkan akses bila diminta
- [ ] **A3.** Buka **View → Logs** (Ctrl+Enter) → **salin secret** yang tampil, simpan sebentar di Notepad
- [ ] **A4.** **Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy**
- [ ] **A5.** Salin **Web app URL** (bentuknya `https://script.google.com/macros/s/AKfycb.../exec`)

> Sekarang Bang Syam punya 2 nilai di Notepad:
> **URL** (A5) dan **SECRET** (A3). Dipakai di Bagian C.

---

## BAGIAN B — Import ke Vercel

- [ ] **B1.** Buka https://vercel.com → login **pakai akun GitHub** (Djebod)
- [ ] **B2.** **Add New → Project**
- [ ] **B3.** Cari repo **`kunci-aston`** → **Import**
- [ ] **B4.** Di halaman konfigurasi:
  - **Framework Preset:** pilih **Other**
  - **Root Directory:** biarkan `./` (default)
  - Build/Output: biarkan kosong
- [ ] **B5.** **JANGAN klik Deploy dulu** — buka dulu **Environment Variables** di halaman yang sama (lanjut ke Bagian C)

> Kalau terlanjur ke-Deploy tanpa env var, tidak apa-apa — nanti tinggal tambahkan env var lalu Redeploy (Bagian C bawah).

---

## BAGIAN C — Environment Variables (kredensial)

Ini yang membuat Vercel bisa bicara ke Apps Script tanpa membocorkan apa pun ke browser.

- [ ] **C1.** Di bagian **Environment Variables**, tambahkan dua ini:

  | Key | Value |
  |---|---|
  | `GAS_URL` | Web app URL dari **A5** |
  | `GAS_SECRET` | secret dari **A3** |

- [ ] **C2.** Pastikan keduanya aktif untuk **Production, Preview, Development** (default sudah semua)
- [ ] **C3.** Klik **Deploy**
- [ ] **C4.** Tunggu ± 1 menit → muncul **Congratulations** + tombol **Visit** / **Continue to Dashboard**

> **Kalau tadi sudah terlanjur Deploy di Bagian B:**
> Settings → Environment Variables → tambahkan `GAS_URL` & `GAS_SECRET` → simpan →
> tab **Deployments → ⋯ (titik tiga) → Redeploy**. Wajib redeploy supaya env var terbaca.

---

## BAGIAN D — Uji

- [ ] **D1.** Klik **Visit** → halaman login Manajemen Kunci muncul
- [ ] **D2.** Login: `itm@astoncirebon.com` / `Dolar@13`
- [ ] **D3.** Coba buka tab **Pinjam** — kalau daftar kunci muncul, berarti Vercel ↔ Apps Script ↔ Sheets sudah nyambung penuh
- [ ] **D4.** Buka tab **Akun** → ganti password (biar `Dolar@13` yang di kode tidak berlaku lagi)

Kalau D3 gagal, cek tabel di bawah.

---

## Kalau macet

| Yang muncul di layar | Sebab | Solusi |
|---|---|---|
| `Server belum dikonfigurasi` | `GAS_URL`/`GAS_SECRET` belum ada, atau belum Redeploy | Tambahkan env var → Redeploy |
| `Akses ditolak` di semua aksi | `GAS_SECRET` (Vercel) ≠ `API_SECRET` (Apps Script) | Samakan — salin ulang dari A3 |
| `Backend tidak merespons dengan benar` | Deployment Apps Script belum "Who has access: **Anyone**" | Manage deployments → Edit → Who has access: Anyone → New version |
| Halaman login muncul tapi `Pinjam` kosong / error | URL salah / belum deploy versi baru | Cek `GAS_URL` = URL `/exec` yang benar (A5) |
| Halaman 404 di Vercel | Root Directory salah | Settings → General → Root Directory = `./` |

---

## Setelah semua jalan

- **Domain sendiri (opsional):** Vercel → Settings → Domains → tambah `kunci.astoncirebon.com` → arahkan CNAME ke `cname.vercel-dns.com` di DNS Squarespace.
- **Update kode berikutnya:** cukup `git add . && git commit -m "..." && git push` — Vercel auto-deploy. Env var tidak perlu diubah lagi.
- **Ubah logika di `Code.gs`:** Apps Script → Deploy → Manage deployments → New version. URL tetap sama, Vercel tidak perlu disentuh.
