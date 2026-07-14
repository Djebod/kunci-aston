/**
 * ============================================================
 *  API ENDPOINT — untuk frontend yang di-host di Vercel
 *  Tambahkan sebagai file .gs BARU di project yang sama.
 *  (File → + → Script → beri nama "ApiEndpoint")
 *
 *  File ini memakai fungsi rpc() dari Code.gs. Jangan hapus Code.gs.
 *  doGet() di Code.gs tetap boleh ada — Apps Script versi HtmlService
 *  masih bisa dipakai berdampingan sebagai cadangan.
 * ============================================================
 */

/**
 * Hanya Vercel yang boleh memanggil endpoint ini.
 * Simpan secret di Script Properties, BUKAN di dalam kode:
 *   Apps Script → ⚙ Project Settings → Script Properties → Add
 *   Property : API_SECRET
 *   Value    : (string acak panjang, sama dengan GAS_SECRET di Vercel)
 */
function apiSecret_() {
  const s = PropertiesService.getScriptProperties().getProperty('API_SECRET');
  if (!s) throw new Error('API_SECRET belum di-set di Script Properties.');
  return s;
}

/** Bandingkan tanpa membocorkan panjang lewat waktu eksekusi. */
function safeEq_(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function jsonOut_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Body yang diharapkan dari /api/rpc di Vercel:
 *   { secret: "...", req: { action, token, data } }
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: 'Body kosong.' });
    }

    const body = JSON.parse(e.postData.contents);

    if (!safeEq_(body.secret, apiSecret_())) {
      // Jangan bocorkan alasan spesifik ke pemanggil
      audit_(null, 'API_DITOLAK', 'endpoint', 'Secret tidak cocok');
      return jsonOut_({ ok: false, error: 'Akses ditolak.' });
    }

    // rpc() sudah menangani auth, role, dan error-nya sendiri
    return jsonOut_(rpc(body.req || {}));

  } catch (err) {
    return jsonOut_({ ok: false, error: err.message || String(err) });
  }
}

/**
 * Jalankan sekali untuk membuat API_SECRET otomatis.
 * Nilainya muncul di View → Logs — salin ke Vercel sebagai GAS_SECRET.
 */
function buatApiSecret() {
  const secret = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '');
  PropertiesService.getScriptProperties().setProperty('API_SECRET', secret);
  Logger.log('API_SECRET dibuat. Salin nilai ini ke Vercel sebagai GAS_SECRET:');
  Logger.log(secret);
  SpreadsheetApp.getUi().alert(
    'API_SECRET sudah dibuat.\n\nBuka View → Logs (Ctrl+Enter) untuk menyalin nilainya, ' +
    'lalu simpan di Vercel sebagai environment variable GAS_SECRET.'
  );
}
