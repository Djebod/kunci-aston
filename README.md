# Key Management — Deploy ke Vercel

Frontend pindah ke Vercel. **Google Sheets tetap jadi database**, Apps Script berubah peran dari "web server" menjadi "API".

---

## Kenapa tidak bisa langsung dipindah utuh?

`HtmlService` dan `google.script.run` hanya hidup di dalam infrastruktur Google — tidak bisa dijalankan di Vercel. Jadi yang dipindah adalah lapisan tampilannya, sementara logika + data tetap di tempat semula.

```
Browser  →  Vercel: public/index.html
              ↓ POST /api/rpc
           Vercel: api/rpc.js          ← GAS_URL & GAS_SECRET hanya ada di sini
              ↓ POST (server-to-server)
           Apps Script: doPost()       ← validasi secret
              ↓
           Apps Script: rpc()          ← auth, role, audit (tidak berubah)
              ↓
           Google Sheets
```

**Kenapa lewat serverless function, bukan browser langsung ke Apps Script?**

1. URL Apps Script dan shared secret tidak pernah sampai ke browser — tidak terlihat di Inspect Element maupun di tab Network.
2. Apps Script membalas lewat redirect ke `googleusercontent.com`, yang merepotkan untuk CORS dari browser. Server-to-server tidak kena CORS sama sekali.
3. Satu titik terpusat kalau nanti mau ditambah rate limit atau logging.

Semua pengamanan yang sudah ada — hash password, token sesi, cek role tiap request, audit log — **tidak berubah sedikit pun**. Yang bertambah hanya satu lapis lagi di depannya.

---

## Struktur proyek

```
kunci-aston/
├── api/
│   └── rpc.js          ← serverless function (proxy)
├── public/
│   └── index.html      ← UI, sama persis, hanya RPC-nya diganti fetch
├── vercel.json         ← header keamanan
└── ApiEndpoint.gs      ← BUKAN untuk Vercel; tempel ini ke Apps Script
```

---

## Langkah

### 1. Apps Script — tambah endpoint API

Di project Apps Script yang sudah ada (yang berisi `Code.gs` + `Index`):

- **File → + → Script**, beri nama `ApiEndpoint`, tempel isi `ApiEndpoint.gs`
- Pilih fungsi **`buatApiSecret`** → **Run**
- Buka **View → Logs** (Ctrl+Enter) → **salin nilai secret-nya**, simpan sebentar

> `Code.gs` dan file `Index` tidak perlu diubah. Versi Apps Script yang lama tetap jalan sebagai cadangan.

### 2. Apps Script — deploy ulang

**Deploy → Manage deployments → ✏️ → Version: New version → Deploy**

| Setting | Nilai |
|---|---|
| Execute as | **Me** |
| Who has access | **Anyone** |

Salin **Web app URL** — bentuknya `https://script.google.com/macros/s/AKfycb.../exec`

> "Anyone" di sini aman: `doPost` menolak semua request yang tidak membawa secret yang benar.

### 3. Push ke GitHub

```bash
cd kunci-aston
git init
git add .
git commit -m "Key Management Aston — frontend Vercel"
git branch -M main
git remote add origin https://github.com/Djebod/kunci-aston.git
git push -u origin main
```

### 4. Import ke Vercel

Vercel → **Add New → Project** → pilih repo → **Framework Preset: Other** → Deploy.

### 5. Environment Variables

Vercel → **Settings → Environment Variables** → tambahkan dua ini untuk *Production, Preview, Development*:

| Name | Value |
|---|---|
| `GAS_URL` | Web app URL dari langkah 2 |
| `GAS_SECRET` | secret dari langkah 1 |

Lalu **Deployments → ⋯ → Redeploy** supaya env var terbaca.

### 6. Custom domain

Vercel → **Settings → Domains** → tambahkan mis. `kunci.astoncirebon.com`, lalu arahkan CNAME di penyedia DNS ke `cname.vercel-dns.com`.

---

## Kalau ada perubahan

| Yang diubah | Cara deploy |
|---|---|
| `public/index.html` atau `api/rpc.js` | `git add . && git commit -m "..." && git push` → Vercel auto-deploy |
| `Code.gs` (logika, role, audit) | Apps Script → Deploy → Manage deployments → New version. **URL tetap sama**, tidak perlu ubah env var Vercel. |

---

## Vercel vs Apps Script — mana yang dipakai?

| | Apps Script (HtmlService) | Vercel |
|---|---|---|
| Setup | Paling cepat, sudah jalan | Perlu GitHub + env var |
| URL | `script.google.com/macros/s/…` panjang | Domain sendiri, mis. `kunci.astoncirebon.com` |
| Kecepatan muat | Lebih lambat (cold start Google) | Cepat, CDN global |
| Tampil di HP | Bisa, tapi URL-nya jelek | Rapi, bisa PWA / Add to Home Screen |
| Biaya | Gratis | Gratis (hobby tier cukup) |
| Titik gagal | 1 | 2 (Vercel + Apps Script) |
| Database | Google Sheets | Google Sheets (sama) |

**Saran:** kalau tujuannya cuma dipakai internal staff, versi Apps Script sudah cukup dan lebih sedikit yang bisa rusak. Pindah ke Vercel kalau ingin domain sendiri, muat lebih cepat, atau nanti mau dikembangkan jadi PWA.

Keduanya bisa hidup berdampingan menunjuk ke sheet yang sama — tidak ada konflik.

---

## Troubleshooting

| Gejala | Sebab & solusi |
|---|---|
| `Server belum dikonfigurasi` | `GAS_URL` / `GAS_SECRET` belum di-set di Vercel, atau belum redeploy setelah menambahkannya |
| `Akses ditolak` di semua aksi | `GAS_SECRET` di Vercel ≠ `API_SECRET` di Script Properties |
| `Backend tidak merespons dengan benar` | Deployment Apps Script belum "Who has access: **Anyone**" |
| Sudah ubah `Code.gs` tapi tidak berubah | Belum deploy **New version** di Apps Script (bukan sekadar save) |

---

## Batas kuota (gratis)

Apps Script consumer account: ~20.000 eksekusi/hari. Satu staff yang pinjam + kembalikan ≈ 8–10 eksekusi. Untuk ~230 karyawan Aston Cirebon, jauh di bawah batas.
