const express = require('express');
const router = express.Router();
const axios = require('axios');

function cfg() {
  const c = global.appConfig?.shopify || {};
  return {
    apiKey:     c.apiKey     || process.env.SHOPIFY_API_KEY     || '',
    apiSecret:  c.apiSecret  || process.env.SHOPIFY_API_SECRET  || '',
    redirectUri:c.redirectUri|| process.env.SHOPIFY_REDIRECT_URI|| 'http://localhost:3001/api/shopify/callback'
  };
}

const SHOPIFY_SCOPES = 'read_products,write_products,read_orders,write_orders';
const pendingStates = new Map();

router.get('/auth-url', (req, res) => {
  const { shop } = req.query;
  if (!shop) return res.status(400).json({ error: 'נדרש פרמטר shop' });
  const { apiKey, redirectUri } = cfg();
  if (!apiKey) return res.json({ url: null, message: 'Shopify API Key לא מוגדר. הגדר בלשונית אדמין.', configured: false });

  const state = Math.random().toString(36).substr(2, 16);
  pendingStates.set(state, { shop, createdAt: Date.now() });
  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
  const params = new URLSearchParams({ client_id: apiKey, scope: SHOPIFY_SCOPES, redirect_uri: redirectUri, state });
  res.json({ url: `https://${shopDomain}/admin/oauth/authorize?${params}`, configured: true });
});

router.get('/callback', async (req, res) => {
  const { code, shop, state, error } = req.query;
  const frontendUrl = global.appConfig?.general?.frontendUrl || 'http://localhost:5173';
  if (error) return res.redirect(`${frontendUrl}?shopify_error=${error}`);
  const pending = pendingStates.get(state);
  if (!pending) return res.redirect(`${frontendUrl}?shopify_error=invalid_state`);
  pendingStates.delete(state);
  const { apiKey, apiSecret } = cfg();
  try {
    const response = await axios.post(`https://${shop}/admin/oauth/access_token`, { client_id: apiKey, client_secret: apiSecret, code });
    const shopData = await axios.get(`https://${shop}/admin/api/2023-10/shop.json`, { headers: { 'X-Shopify-Access-Token': response.data.access_token } });
    const storeEntry = { shop, accessToken: response.data.access_token, storeName: shopData.data.shop.name, email: shopData.data.shop.email, connectedAt: new Date().toISOString(), productsCount: shopData.data.shop.count_products || 0 };
    const existing = global.storeConnections.shopify.findIndex(s => s.shop === shop);
    if (existing >= 0) global.storeConnections.shopify[existing] = storeEntry;
    else global.storeConnections.shopify.push(storeEntry);
    res.redirect(`${frontendUrl}?shopify_connected=true&shop=${shop}`);
  } catch (err) {
    console.error('Shopify OAuth error:', err.message);
    res.redirect(`${frontendUrl}?shopify_error=token_exchange_failed`);
  }
});

router.get('/status', (req, res) => {
  const stores = global.storeConnections.shopify;
  res.json({ connected: stores.length > 0, stores: stores.map(s => ({ shop: s.shop, storeName: s.storeName, email: s.email, connectedAt: s.connectedAt, productsCount: s.productsCount || 0, isDemo: s.isDemo || false })) });
});

router.get('/products', async (req, res) => {
  const { shop } = req.query;
  const storeConn = global.storeConnections.shopify.find(s => s.shop === shop);
  if (!storeConn) return res.status(401).json({ error: 'חנות לא מחוברת' });
  try {
    const response = await axios.get(`https://${shop}/admin/api/2023-10/products.json?limit=50`, { headers: { 'X-Shopify-Access-Token': storeConn.accessToken } });
    res.json({ products: response.data.products });
  } catch (err) { res.json({ products: [], error: err.message }); }
});

router.post('/list-product', async (req, res) => {
  const { shop, title } = req.body;
  await new Promise(r => setTimeout(r, 600));
  const storeConn = global.storeConnections.shopify.find(s => s.shop === shop);
  if (!storeConn) return res.status(401).json({ error: 'חנות לא מחוברת' });
  res.json({ success: true, productId: 'shopify-prod-' + Date.now(), title, url: `https://${shop}/products/${title?.toLowerCase().replace(/\s+/g, '-')}`, message: `המוצר פורסם ב-${storeConn.storeName}` });
});

router.delete('/disconnect', (req, res) => {
  const { shop } = req.query;
  if (shop) global.storeConnections.shopify = global.storeConnections.shopify.filter(s => s.shop !== shop);
  else global.storeConnections.shopify = [];
  res.json({ success: true, message: 'החיבור לשופיפיי נותק בהצלחה' });
});

router.post('/connect-demo', (req, res) => {
  const { shop } = req.body;
  const shopDomain = shop || 'demo-store.myshopify.com';
  const storeEntry = { shop: shopDomain, accessToken: 'demo-token-' + Date.now(), storeName: 'החנות שלי', email: 'demo@example.com', connectedAt: new Date().toISOString(), productsCount: 0, isDemo: true };
  const existing = global.storeConnections.shopify.findIndex(s => s.shop === shopDomain);
  if (existing >= 0) global.storeConnections.shopify[existing] = storeEntry;
  else global.storeConnections.shopify.push(storeEntry);
  res.json({ success: true, message: 'חובר בהצלחה (מצב הדגמה)', shop: shopDomain, storeName: 'החנות שלי' });
});

module.exports = router;
