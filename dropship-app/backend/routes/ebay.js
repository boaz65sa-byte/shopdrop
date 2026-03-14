const express = require('express');
const router = express.Router();
const axios = require('axios');

function cfg() {
  const c = global.appConfig?.ebay || {};
  return {
    clientId:    c.clientId    || process.env.EBAY_CLIENT_ID     || '',
    clientSecret:c.clientSecret|| process.env.EBAY_CLIENT_SECRET || '',
    redirectUri: c.redirectUri || process.env.EBAY_REDIRECT_URI  || 'http://localhost:3001/api/ebay/callback',
    env:         c.env         || process.env.EBAY_ENV           || 'sandbox'
  };
}

const mockEbayProducts = [
  { id: 'ebay-001', title: 'שעון חכם עמיד למים עם מד לחץ דם', price: 89.99, currency: 'ILS', image: 'https://picsum.photos/seed/ebay1/400/300', status: 'ACTIVE', quantity: 15, views: 234, sales: 12 },
  { id: 'ebay-002', title: 'אוזניות בלוטות\' ביטול רעשים פרימיום', price: 149.90, currency: 'ILS', image: 'https://picsum.photos/seed/ebay2/400/300', status: 'ACTIVE', quantity: 8, views: 567, sales: 34 },
  { id: 'ebay-003', title: 'מטען אלחוטי מהיר 15W', price: 45.00, currency: 'ILS', image: 'https://picsum.photos/seed/ebay3/400/300', status: 'ACTIVE', quantity: 25, views: 189, sales: 8 }
];

router.get('/auth-url', (req, res) => {
  const { clientId, redirectUri, env } = cfg();
  if (!clientId) {
    return res.json({ url: null, message: 'eBay Client ID לא מוגדר. הגדר בלשונית אדמין.', configured: false });
  }
  const authUrl = env === 'production'
    ? 'https://auth.ebay.com/oauth2/authorize'
    : 'https://auth.sandbox.ebay.com/oauth2/authorize';

  const scopes = ['https://api.ebay.com/oauth/api_scope','https://api.ebay.com/oauth/api_scope/sell.inventory','https://api.ebay.com/oauth/api_scope/sell.account','https://api.ebay.com/oauth/api_scope/sell.fulfillment'].join(' ');
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: scopes, prompt: 'login' });
  res.json({ url: `${authUrl}?${params}`, configured: true });
});

router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = global.appConfig?.general?.frontendUrl || 'http://localhost:5173';
  const { clientId, clientSecret, redirectUri, env } = cfg();

  if (error) return res.redirect(`${frontendUrl}?ebay_error=${error}`);
  if (!code) return res.redirect(`${frontendUrl}?ebay_error=no_code`);

  const tokenUrl = env === 'production'
    ? 'https://api.ebay.com/identity/v1/oauth2/token'
    : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await axios.post(tokenUrl, new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }), {
      headers: { 'Authorization': `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    global.storeConnections.ebay = {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
      expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      username: 'ebay_user_' + Math.random().toString(36).substr(2, 6),
      storeName: 'החנות שלי באיביי',
      connectedAt: new Date().toISOString()
    };
    res.redirect(`${frontendUrl}?ebay_connected=true`);
  } catch (err) {
    console.error('eBay OAuth error:', err.message);
    res.redirect(`${frontendUrl}?ebay_error=token_exchange_failed`);
  }
});

router.get('/status', (req, res) => {
  const conn = global.storeConnections.ebay;
  conn ? res.json({ connected: true, username: conn.username, storeName: conn.storeName, connectedAt: conn.connectedAt, productsCount: 3, totalSales: 54, isDemo: conn.isDemo || false })
       : res.json({ connected: false });
});

router.get('/products', (req, res) => res.json({ products: mockEbayProducts, total: mockEbayProducts.length }));

router.post('/list-product', async (req, res) => {
  await new Promise(r => setTimeout(r, 800));
  if (!global.storeConnections.ebay) return res.status(401).json({ error: 'לא מחובר לאיביי' });
  const { title } = req.body;
  res.json({ success: true, listingId: 'ebay-listing-' + Date.now(), title, url: `https://www.ebay.com/itm/listing-${Date.now()}`, message: 'המוצר פורסם בהצלחה באיביי' });
});

router.delete('/disconnect', (req, res) => {
  global.storeConnections.ebay = null;
  res.json({ success: true, message: 'החיבור לאיביי נותק בהצלחה' });
});

router.post('/connect-demo', (req, res) => {
  global.storeConnections.ebay = { accessToken: 'demo-token-' + Date.now(), username: 'demo_seller_il', storeName: 'החנות שלי באיביי', connectedAt: new Date().toISOString(), isDemo: true };
  res.json({ success: true, message: 'חובר בהצלחה (מצב הדגמה)', username: 'demo_seller_il' });
});

module.exports = router;
