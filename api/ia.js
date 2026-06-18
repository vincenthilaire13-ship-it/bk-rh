// ──────────────────────────────────────────────────────────────────────────
//  /api/ia  —  Proxy serverless vers l'API Anthropic (Claude) pour BKRH
//  La clé API reste côté serveur (variable d'environnement Vercel).
//  L'appli envoie en POST : { model?, max_tokens, system?, messages }
//  et reçoit la réponse Anthropic telle quelle (data.content[]).
// ──────────────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS (même origine en prod ; large par sécurité pour les tests)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Méthode non autorisée' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'Clé API non configurée côté serveur' }); return; }

  try {
    // Récupération du corps (selon l'environnement Vercel, req.body peut être string ou objet)
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    body = body || {};

    const payload = {
      model: body.model || 'claude-sonnet-4-6',
      max_tokens: body.max_tokens || 1024,
      messages: Array.isArray(body.messages) ? body.messages : [],
    };
    if (body.system) payload.system = body.system;

    const apiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await apiResp.json();
    res.status(apiResp.status).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur proxy IA', detail: String(err && err.message || err) });
  }
}
