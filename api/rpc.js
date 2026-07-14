/**
 * /api/rpc — jembatan Vercel → Apps Script
 *
 * Kenapa lewat sini, bukan browser langsung ke Apps Script?
 *  1. GAS_URL dan GAS_SECRET hanya hidup di server Vercel.
 *     Browser tidak pernah melihatnya, jadi tidak muncul di Inspect Element.
 *  2. Apps Script Web App membalas lewat redirect ke googleusercontent.com —
 *     merepotkan untuk CORS dari browser. Server-to-server tidak kena CORS.
 *  3. Satu titik untuk rate limit / logging kalau nanti diperlukan.
 *
 * Environment variables (Vercel → Settings → Environment Variables):
 *   GAS_URL     = https://script.google.com/macros/s/AKfycb.../exec
 *   GAS_SECRET  = string acak panjang, sama persis dengan Script Properties
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  const GAS_URL    = process.env.GAS_URL;
  const GAS_SECRET = process.env.GAS_SECRET;

  if (!GAS_URL || !GAS_SECRET) {
    return res.status(500).json({
      ok: false,
      error: 'Server belum dikonfigurasi. Set GAS_URL dan GAS_SECRET di Vercel.'
    });
  }

  // Body dari browser: { action, token, data }
  const { action, token, data } = req.body || {};
  if (!action) {
    return res.status(400).json({ ok: false, error: 'Aksi tidak disebutkan.' });
  }

  try {
    const upstream = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',                       // Apps Script selalu redirect sekali
      body: JSON.stringify({
        secret: GAS_SECRET,
        req: { action, token: token || '', data: data || {} }
      })
    });

    const text = await upstream.text();

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Biasanya berarti Apps Script mengembalikan halaman login/error HTML
      console.error('Respons Apps Script bukan JSON:', text.slice(0, 300));
      return res.status(502).json({
        ok: false,
        error: 'Backend tidak merespons dengan benar. Pastikan deployment Apps Script "Who has access: Anyone".'
      });
    }

    // Jangan pernah cache respons yang mengandung data sesi
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(json);

  } catch (e) {
    console.error('Gagal menghubungi Apps Script:', e);
    return res.status(502).json({ ok: false, error: 'Tidak bisa menghubungi backend.' });
  }
}
