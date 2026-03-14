const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');

function cfg() {
  const c = global.appConfig?.etsy || {};
  return {
    clientId:   c.clientId   || process.env.ETSY_CLIENT_ID    || '',
    redirectUri:c.redirectUri|| process.env.ETSY_REDIRECT_URI || 'http://localhost:3001/api/etsy/callback'
  };
}

const pendingStates = new Map();
const genVerifier = () => crypto.randomBytes(32).toString('base64url');
const genChallenge = v => crypto.createHash('sha256').update(v).digest('base64url');

router.get('/auth-url', (req, res) => {
  const { clientId, redirectUri } = cfg();
  if (!clientId) return res.json({ url: null, message: 'Etsy API Key לא מוגדר. הגדר בלשונית אדמין.', configured: false });
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = genVerifier();
  pendingStates.set(state, { codeVerifier, createdAt: Date.now() });
  const params = new URLSearchParams({ response_type: 'code', redirect_uri: redirectUri, scope: 'listings_r listings_w transactions_r shops_r', client_id: clientId, state, code_challenge: genChallenge(codeVerifier), code_challenge_method: 'S256' });
  res.json({ url: `https://www.etsy.com/oauth/connect?${params}`, configured: true });
});

router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = global.appConfig?.general?.frontendUrl || 'http://localhost:5173';
  if (error) return res.redirect(`${frontendUrl}?etsy_error=${error}`);
  const pending = pendingStates.get(state);
  if (!pending) return res.redirect(`${frontendUrl}?etsy_error=invalid_state`);
  pendingStates.delete(state);
  const { clientId, redirectUri } = cfg();
  try {
    const tokenRes = await axios.post('https://api.etsy.com/v3/public/oauth/token', { grant_type: 'authorization_code', client_id: clientId, redirect_uri: redirectUri, code, code_verifier: pending.codeVerifier });
    const meRes = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers: { 'x-api-key': clientId, Authorization: `Bearer ${tokenRes.data.access_token}` } });
    global.storeConnections.etsy = { accessToken: tokenRes.data.access_token, refreshToken: tokenRes.data.refresh_token, userId: meRes.data.user_id, shopName: meRes.data.primary_email || 'Etsy Shop', connectedAt: new Date().toISOString() };
    res.redirect(`${frontendUrl}?etsy_connected=true`);
  } catch (err) {
    console.error('Etsy OAuth error:', err.message);
    res.redirect(`${frontendUrl}?etsy_error=token_exchange_failed`);
  }
});

router.get('/status', (req, res) => {
  const conn = global.storeConnections.etsy;
  conn ? res.json({ connected: true, shopName: conn.shopName, userId: conn.userId, connectedAt: conn.connectedAt, isDemo: conn.isDemo || false })
       : res.json({ connected: false });
});

router.post('/connect-demo', (req, res) => {
  global.storeConnections.etsy = { accessToken: 'demo-token-' + Date.now(), userId: 'demo_' + Math.random().toString(36).substr(2, 6), shopName: 'MyIsraeliShop', connectedAt: new Date().toISOString(), isDemo: true };
  res.json({ success: true, message: 'חובר לאטסי (מצב הדגמה)', shopName: 'MyIsraeliShop' });
});

router.post('/list-product', async (req, res) => {
  await new Promise(r => setTimeout(r, 700));
  if (!global.storeConnections.etsy) return res.status(401).json({ error: 'לא מחובר לאטסי' });
  const { title } = req.body;
  res.json({ success: true, listingId: Date.now(), title, url: `https://www.etsy.com/listing/${Date.now()}`, message: 'המוצר פורסם בהצלחה באטסי' });
});

router.delete('/disconnect', (req, res) => {
  global.storeConnections.etsy = null;
  res.json({ success: true, message: 'החיבור לאטסי נותק' });
});

module.exports = router;
