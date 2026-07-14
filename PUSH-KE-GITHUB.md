# Push ke GitHub — `kunci-aston`

Panduan menaruh folder `vercel/` ke repo GitHub `Djebod/kunci-aston`, siap dihubungkan ke Vercel.

> **Catatan:** Folder `ApiEndpoint.gs` ikut ter-push juga tidak masalah — itu cuma referensi, Vercel mengabaikannya. Yang penting `api/`, `public/`, dan `vercel.json` ada.

---

## Langkah 1 — Buat repo kosong di GitHub

1. Buka https://github.com/new
2. **Repository name:** `kunci-aston`
3. **Private** (disarankan — ini aplikasi internal)
4. **JANGAN** centang "Add a README" / .gitignore / license — biar repo benar-benar kosong
5. Klik **Create repository**

---

## Langkah 2 — Buka terminal di folder proyek

Download folder `vercel/` dari chat ini, taruh di komputer, lalu buka terminal di dalamnya.

```bash
cd path/ke/vercel
```

Cek isinya benar:

```bash
ls
# harus muncul: api  public  vercel.json  ApiEndpoint.gs  README.md  .gitignore  .env.example
```

---

## Langkah 3 — Inisialisasi git

```bash
git init
git add .
git commit -m "Key Management Aston — frontend Vercel"
git branch -M main
```

> Kalau muncul peringatan **"dubious ownership"** (sering terjadi kalau folder dipindah antar PC / drive):
> ```bash
> git config --global --add safe.directory "$(pwd)"
> ```
> lalu ulangi `git add .`

> Kalau git minta identitas (baru pertama kali di PC ini):
> ```bash
> git config --global user.name "Djebod"
> git config --global user.email "email-github-anda@contoh.com"
> ```

---

## Langkah 4 — Hubungkan ke repo GitHub

```bash
git remote add origin https://github.com/Djebod/kunci-aston.git
```

> Kalau muncul `error: remote origin already exists` (folder pernah dipakai git sebelumnya):
> ```bash
> git remote set-url origin https://github.com/Djebod/kunci-aston.git
> ```

Cek sudah benar:

```bash
git remote -v
# origin  https://github.com/Djebod/kunci-aston.git (fetch)
# origin  https://github.com/Djebod/kunci-aston.git (push)
```

---

## Langkah 5 — Push

```bash
git push -u origin main
```

**Saat diminta login:**
- Username: `Djebod`
- Password: **bukan** password GitHub biasa — pakai **Personal Access Token**

### Bikin token (kalau belum punya)
1. https://github.com/settings/tokens → **Generate new token (classic)**
2. Note: `kunci-aston`, Expiration: 90 hari (atau sesuai selera)
3. Centang scope **`repo`** saja
4. **Generate** → salin token (muncul sekali saja) → tempel sebagai password

> Biar tidak diminta token terus:
> ```bash
> git config --global credential.helper store
> ```
> (setelah ini, sekali masukkan token, tersimpan)

---

## Langkah 6 — Verifikasi

Buka https://github.com/Djebod/kunci-aston — folder `api/`, `public/`, dan `vercel.json` harus terlihat.

Selesai. Lanjut ke **README.md → Langkah 4 (Import ke Vercel)**.

---

## Update berikutnya

Setiap kali mengubah `index.html` atau `rpc.js`, cukup:

```bash
git add .
git commit -m "keterangan singkat perubahan"
git push
```

Vercel otomatis deploy ulang tiap kali `push` ke `main`.

---

## Kalau macet — masalah umum multi-PC

| Pesan error | Solusi |
|---|---|
| `dubious ownership in repository` | `git config --global --add safe.directory "$(pwd)"` |
| `remote origin already exists` | `git remote set-url origin https://github.com/Djebod/kunci-aston.git` |
| `Updates were rejected` / `failed to push` | Repo di GitHub tidak kosong. Kalau yakin isinya boleh ditimpa: `git push -u origin main --force` |
| `Authentication failed` | Password salah — harus **token**, bukan password akun |
| `src refspec main does not match` | Belum commit. Ulangi `git add .` lalu `git commit -m "..."` |
| Nama branch `master`, bukan `main` | `git branch -M main` sebelum push |

---

## Alternatif tanpa terminal (GitHub Desktop)

Kalau lebih nyaman klik-klik:

1. Install **GitHub Desktop** (desktop.github.com), login akun `Djebod`
2. **File → Add local repository** → pilih folder `vercel/`
3. Kalau diminta, klik **create a repository** → **Publish repository**
4. Beri nama `kunci-aston`, centang **Keep this code private** → **Publish**
5. Update selanjutnya: ketik pesan di kotak **Summary** → **Commit to main** → **Push origin**
