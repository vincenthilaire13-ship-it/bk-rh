// Proxy serverless Vercel — BK RH
// Échange le refresh token Dropbox (gardé côté serveur) contre un access_token temporaire.
// App Dropbox dédiée BKRH ("App folder", dossier "BK RH") — SÉPARÉE de BK Technique.
//
// Variables d'environnement à configurer sur Vercel (projet BKRH) :
//   DBX_APP_KEY        = s0n5mxaqjkkzv20
//   DBX_APP_SECRET     = (le secret BKRH)
//   DBX_REFRESH_TOKEN  = (le refresh token BKRH)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const APP_KEY = process.env.DBX_APP_KEY;
  const APP_SECRET = process.env.DBX_APP_SECRET;
  const REFRESH = process.env.DBX_REFRESH_TOKEN;

  if (!APP_KEY || !APP_SECRET || !REFRESH) {
    return res.status(500).json({ error: 'Configuration Dropbox manquante côté serveur' });
  }

  try {
    const r = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: REFRESH,
        client_id: APP_KEY,
        client_secret: APP_SECRET,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json({ error: 'Échec renouvellement token Dropbox', detail: data });
    }
    return res.status(200).json({ access_token: data.access_token, expires_in: data.expires_in });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur Dropbox', detail: String(e) });
  }
}
