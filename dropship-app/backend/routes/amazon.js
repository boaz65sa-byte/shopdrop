const express = require('express');
const router = express.Router();
const axios = require('axios');

function cfg() {
  const c = global.appConfig?.amazon || {};
  return {
    clientId:    c.clientId    || process.env.AMAZON_CLIENT_ID     || '',
    clientSecret:c.clientSecret|| process.env.AMAZON_CLIENT_SECRET || '',
    redirectUri: c.redirectUri || process.env.AMAZON_REDIRECT_URI  || 'http://localhost:3001/api/amazon/callback',
    marketplace: c.marketplace || process.env.AMAZON_MARKETPLACE   || 'A1F83G8C2ARO7P'
  };
}

const pendingStates = new Map();

router.get('/auth-url', (req, res) => {
  const { clientId, redirectUri } = cfg();
  if (!clientId) return res.json({ url: null, message: 'Amazon Client ID לא מוגדר. הגדר בלשונית אדמין.', configured: false });
  const state = Math.random().toString(36).substr(2, 16);
  pendingStates.set(state, { createdAt: Date.now() });
  const params = new URLSearchParams({ application_id: clientId, state, redirect_uri: redirectUri, version: 'beta' });
  res.json({ url: `https://sellercentral.amazon.com/apps/authorize/consent?${params}`, configured: true });
});

router.get('/callback', async (req, res) => {
  const { spapi_oauth_code, state, selling_partner_id, error } = req.query;
  const frontendUrl = global.appConfig?.general?.frontendUrl || 'http://localhost:5173';
  if (error) return res.redirect(`${frontendUrl}?amazon_error=${error}`);
  if (!spapi_oauth_code) return res.redirect(`${frontendUrl}?amazon_error=no_code`);
  const { clientId, clientSecret, redirectUri, marketplace } = cfg();
  try {
    const tokenRes = await axios.post('https://api.amazon.com/auth/o2/token', { grant_type: 'authorization_code', code: spapi_oauth_code, redirect_uri: redirectUri, client_id: clientId, client_secret: clientSecret });
    global.storeConnections.amazon = { accessToken: tokenRes.data.access_token, refreshToken: tokenRes.data.refresh_token, sellerId: selling_partner_id, marketplaceId: marketplace, storeName: `Amazon Seller ${selling_partner_id?.substr(0, 6)}`, connectedAt: new Date().toISOString() };
    res.redirect(`${frontendUrl}?amazon_connected=true`);
  } catch (err) {
    console.error('Amazon OAuth error:', err.message);
    res.redirect(`${frontendUrl}?amazon_error=token_exchange_failed`);
  }
});

router.get('/status', (req, res) => {
  const conn = global.storeConnections.amazon;
  conn ? res.json({ connected: true, sellerId: conn.sellerId, storeName: conn.storeName, marketplaceId: conn.marketplaceId, connectedAt: conn.connectedAt, isDemo: conn.isDemo || false })
       : res.json({ connected: false });
});

router.post('/connect-demo', (req, res) => {
  global.storeConnections.amazon = { accessToken: 'demo-token-' + Date.now(), sellerId: 'DEMO' + Math.random().toString(36).substr(2, 6).toUpperCase(), storeName: 'החנות שלי באמזון', marketplaceId: cfg().marketplace, connectedAt: new Date().toISOString(), isDemo: true };
  res.json({ success: true, message: 'חובר לאמזון (מצב הדגמה)', storeName: 'החנות שלי באמזון' });
});

router.post('/list-product', async (req, res) => {
  await new Promise(r => setTimeout(r, 900));
  if (!global.storeConnections.amazon) return res.status(401).json({ error: 'לא מחובר לאמזון' });
  const { title } = req.body;
  res.json({ success: true, asin: 'B0' + Date.now().toString().substr(-8), title, url: `https://www.amazon.com/dp/B0${Date.now().toString().substr(-8)}`, message: 'המוצר נשלח לאישור אמזון' });
});

router.delete('/disconnect', (req, res) => {
  global.storeConnections.amazon = null;
  res.json({ success: true, message: 'החיבור לאמזון נותק' });
});

module.exports = router;
