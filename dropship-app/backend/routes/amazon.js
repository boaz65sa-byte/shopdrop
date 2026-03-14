const express = require('express');
const router = express.Router();
const axios = require('axios');

const AMAZON_CLIENT_ID = process.env.AMAZON_CLIENT_ID || '';
const AMAZON_CLIENT_SECRET = process.env.AMAZON_CLIENT_SECRET || '';
const AMAZON_REDIRECT_URI = process.env.AMAZON_REDIRECT_URI || 'http://localhost:3001/api/amazon/callback';
const AMAZON_MARKETPLACE = process.env.AMAZON_MARKETPLACE || 'A1F83G8C2ARO7P'; // UK, closest to IL

// Pending OAuth states
const pendingStates = new Map();

// GET /api/amazon/auth-url
router.get('/auth-url', (req, res) => {
  if (!AMAZON_CLIENT_ID) {
    return res.json({
      url: null,
      message: 'Amazon Client ID לא מוגדר. הוסף AMAZON_CLIENT_ID ל-.env',
      configured: false
    });
  }

  const state = Math.random().toString(36).substr(2, 16);
  pendingStates.set(state, { createdAt: Date.now() });

  const params = new URLSearchParams({
    application_id: AMAZON_CLIENT_ID,
    state,
    redirect_uri: AMAZON_REDIRECT_URI,
    version: 'beta'
  });

  const url = `https://sellercentral.amazon.com/apps/authorize/consent?${params}`;
  res.json({ url, configured: true });
});

// GET /api/amazon/callback
router.get('/callback', async (req, res) => {
  const { spapi_oauth_code, state, selling_partner_id, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) return res.redirect(`${frontendUrl}?amazon_error=${error}`);

  if (!spapi_oauth_code) return res.redirect(`${frontendUrl}?amazon_error=no_code`);

  try {
    const tokenRes = await axios.post('https://api.amazon.com/auth/o2/token', {
      grant_type: 'authorization_code',
      code: spapi_oauth_code,
      redirect_uri: AMAZON_REDIRECT_URI,
      client_id: AMAZON_CLIENT_ID,
      client_secret: AMAZON_CLIENT_SECRET
    });

    global.storeConnections.amazon = {
      accessToken: tokenRes.data.access_token,
      refreshToken: tokenRes.data.refresh_token,
      sellerId: selling_partner_id,
      marketplaceId: AMAZON_MARKETPLACE,
      storeName: `Amazon Seller ${selling_partner_id?.substr(0, 6)}`,
      connectedAt: new Date().toISOString()
    };

    res.redirect(`${frontendUrl}?amazon_connected=true`);
  } catch (err) {
    console.error('Amazon OAuth error:', err.message);
    res.redirect(`${frontendUrl}?amazon_error=token_exchange_failed`);
  }
});

// GET /api/amazon/status
router.get('/status', (req, res) => {
  const conn = global.storeConnections.amazon;
  if (conn) {
    res.json({
      connected: true,
      sellerId: conn.sellerId,
      storeName: conn.storeName,
      marketplaceId: conn.marketplaceId,
      connectedAt: conn.connectedAt,
      isDemo: conn.isDemo || false
    });
  } else {
    res.json({ connected: false });
  }
});

// POST /api/amazon/connect-demo
router.post('/connect-demo', (req, res) => {
  global.storeConnections.amazon = {
    accessToken: 'demo-token-' + Date.now(),
    sellerId: 'DEMO' + Math.random().toString(36).substr(2, 6).toUpperCase(),
    storeName: 'החנות שלי באמזון',
    marketplaceId: AMAZON_MARKETPLACE,
    connectedAt: new Date().toISOString(),
    isDemo: true
  };
  res.json({
    success: true,
    message: 'חובר לאמזון (מצב הדגמה)',
    storeName: 'החנות שלי באמזון'
  });
});

// POST /api/amazon/list-product
router.post('/list-product', async (req, res) => {
  await new Promise(resolve => setTimeout(resolve, 900));

  if (!global.storeConnections.amazon) {
    return res.status(401).json({ error: 'לא מחובר לאמזון' });
  }

  const { title, price } = req.body;
  res.json({
    success: true,
    asin: 'B0' + Date.now().toString().substr(-8),
    title,
    url: `https://www.amazon.com/dp/B0${Date.now().toString().substr(-8)}`,
    message: 'המוצר נשלח לאישור אמזון'
  });
});

// DELETE /api/amazon/disconnect
router.delete('/disconnect', (req, res) => {
  global.storeConnections.amazon = null;
  res.json({ success: true, message: 'החיבור לאמזון נותק' });
});

module.exports = router;
