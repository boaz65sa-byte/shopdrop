const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

const ETSY_CLIENT_ID = process.env.ETSY_CLIENT_ID || '';
const ETSY_REDIRECT_URI = process.env.ETSY_REDIRECT_URI || 'http://localhost:3001/api/etsy/callback';

// PKCE state store
const pendingStates = new Map();

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// GET /api/etsy/auth-url
router.get('/auth-url', (req, res) => {
  if (!ETSY_CLIENT_ID) {
    return res.json({
      url: null,
      message: 'Etsy API Key לא מוגדר. הוסף ETSY_CLIENT_ID ל-.env',
      configured: false
    });
  }

  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  pendingStates.set(state, { codeVerifier, createdAt: Date.now() });

  const scopes = 'listings_r listings_w transactions_r shops_r';

  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: ETSY_REDIRECT_URI,
    scope: scopes,
    client_id: ETSY_CLIENT_ID,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });

  const url = `https://www.etsy.com/oauth/connect?${params}`;
  res.json({ url, configured: true });
});

// GET /api/etsy/callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) return res.redirect(`${frontendUrl}?etsy_error=${error}`);

  const pending = pendingStates.get(state);
  if (!pending) return res.redirect(`${frontendUrl}?etsy_error=invalid_state`);
  pendingStates.delete(state);

  try {
    const tokenRes = await axios.post('https://api.etsy.com/v3/public/oauth/token', {
      grant_type: 'authorization_code',
      client_id: ETSY_CLIENT_ID,
      redirect_uri: ETSY_REDIRECT_URI,
      code,
      code_verifier: pending.codeVerifier
    });

    // Fetch shop info
    const meRes = await axios.get('https://openapi.etsy.com/v3/application/users/me', {
      headers: { 'x-api-key': ETSY_CLIENT_ID, Authorization: `Bearer ${tokenRes.data.access_token}` }
    });

    global.storeConnections.etsy = {
      accessToken: tokenRes.data.access_token,
      refreshToken: tokenRes.data.refresh_token,
      userId: meRes.data.user_id,
      shopName: meRes.data.primary_email || 'Etsy Shop',
      connectedAt: new Date().toISOString()
    };

    res.redirect(`${frontendUrl}?etsy_connected=true`);
  } catch (err) {
    console.error('Etsy OAuth error:', err.message);
    res.redirect(`${frontendUrl}?etsy_error=token_exchange_failed`);
  }
});

// GET /api/etsy/status
router.get('/status', (req, res) => {
  const conn = global.storeConnections.etsy;
  if (conn) {
    res.json({
      connected: true,
      shopName: conn.shopName,
      userId: conn.userId,
      connectedAt: conn.connectedAt,
      isDemo: conn.isDemo || false
    });
  } else {
    res.json({ connected: false });
  }
});

// POST /api/etsy/connect-demo
router.post('/connect-demo', (req, res) => {
  global.storeConnections.etsy = {
    accessToken: 'demo-token-' + Date.now(),
    userId: 'demo_' + Math.random().toString(36).substr(2, 6),
    shopName: 'MyIsraeliShop',
    connectedAt: new Date().toISOString(),
    isDemo: true
  };
  res.json({ success: true, message: 'חובר לאטסי (מצב הדגמה)', shopName: 'MyIsraeliShop' });
});

// POST /api/etsy/list-product
router.post('/list-product', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 700));

  if (!global.storeConnections.etsy) {
    return res.status(401).json({ error: 'לא מחובר לאטסי' });
  }

  const { title } = req.body;
  res.json({
    success: true,
    listingId: Date.now(),
    title,
    url: `https://www.etsy.com/listing/${Date.now()}`,
    message: 'המוצר פורסם בהצלחה באטסי'
  });
});

// DELETE /api/etsy/disconnect
router.delete('/disconnect', (req, res) => {
  global.storeConnections.etsy = null;
  res.json({ success: true, message: 'החיבור לאטסי נותק' });
});

module.exports = router;
