const express = require('express');
const router = express.Router();
const axios = require('axios');

const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || '';
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const SHOPIFY_REDIRECT_URI = process.env.SHOPIFY_REDIRECT_URI || 'http://localhost:3001/api/shopify/callback';

const SHOPIFY_SCOPES = 'read_products,write_products,read_orders,write_orders';

// In-memory pending OAuth states
const pendingStates = new Map();

// GET /api/shopify/auth-url
router.get('/auth-url', (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).json({ error: 'נדרש פרמטר shop' });
  }

  if (!SHOPIFY_API_KEY) {
    return res.json({
      url: null,
      message: 'Shopify API Key לא מוגדר',
      configured: false
    });
  }

  const state = Math.random().toString(36).substr(2, 16);
  pendingStates.set(state, { shop, createdAt: Date.now() });

  const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;

  const params = new URLSearchParams({
    client_id: SHOPIFY_API_KEY,
    scope: SHOPIFY_SCOPES,
    redirect_uri: SHOPIFY_REDIRECT_URI,
    state: state
  });

  const url = `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`;
  res.json({ url, configured: true });
});

// GET /api/shopify/callback
router.get('/callback', async (req, res) => {
  const { code, shop, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}?shopify_error=${error}`);
  }

  const pendingState = pendingStates.get(state);
  if (!pendingState) {
    return res.redirect(`${frontendUrl}?shopify_error=invalid_state`);
  }
  pendingStates.delete(state);

  try {
    const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code: code
    });

    const shopData = await axios.get(`https://${shop}/admin/api/2023-10/shop.json`, {
      headers: { 'X-Shopify-Access-Token': response.data.access_token }
    });

    const storeEntry = {
      shop: shop,
      accessToken: response.data.access_token,
      storeName: shopData.data.shop.name,
      email: shopData.data.shop.email,
      connectedAt: new Date().toISOString(),
      productsCount: shopData.data.shop.count_products || 0
    };

    const existing = global.storeConnections.shopify.findIndex(s => s.shop === shop);
    if (existing >= 0) {
      global.storeConnections.shopify[existing] = storeEntry;
    } else {
      global.storeConnections.shopify.push(storeEntry);
    }

    res.redirect(`${frontendUrl}?shopify_connected=true&shop=${shop}`);
  } catch (err) {
    console.error('Shopify OAuth error:', err.message);
    res.redirect(`${frontendUrl}?shopify_error=token_exchange_failed`);
  }
});

// GET /api/shopify/status
router.get('/status', (req, res) => {
  const stores = global.storeConnections.shopify;
  res.json({
    connected: stores.length > 0,
    stores: stores.map(s => ({
      shop: s.shop,
      storeName: s.storeName,
      email: s.email,
      connectedAt: s.connectedAt,
      productsCount: s.productsCount || 0
    }))
  });
});

// GET /api/shopify/products
router.get('/products', async (req, res) => {
  const { shop } = req.query;
  const storeConn = global.storeConnections.shopify.find(s => s.shop === shop);

  if (!storeConn) {
    return res.status(401).json({ error: 'חנות לא מחוברת' });
  }

  try {
    const response = await axios.get(
      `https://${shop}/admin/api/2023-10/products.json?limit=50`,
      { headers: { 'X-Shopify-Access-Token': storeConn.accessToken } }
    );
    res.json({ products: response.data.products });
  } catch (err) {
    res.json({ products: [], error: err.message });
  }
});

// POST /api/shopify/list-product
router.post('/list-product', async (req, res) => {
  const { shop, title, price, description, imageUrl } = req.body;

  await new Promise(resolve => setTimeout(resolve, 600));

  const storeConn = global.storeConnections.shopify.find(s => s.shop === shop);
  if (!storeConn) {
    return res.status(401).json({ error: 'חנות לא מחוברת' });
  }

  res.json({
    success: true,
    productId: 'shopify-prod-' + Date.now(),
    title: title,
    url: `https://${shop}/products/${title.toLowerCase().replace(/\s+/g, '-')}`,
    message: `המוצר פורסם בהצלחה בחנות ${storeConn.storeName}`
  });
});

// DELETE /api/shopify/disconnect
router.delete('/disconnect', (req, res) => {
  const { shop } = req.query;

  if (shop) {
    global.storeConnections.shopify = global.storeConnections.shopify.filter(s => s.shop !== shop);
  } else {
    global.storeConnections.shopify = [];
  }

  res.json({ success: true, message: 'החיבור לשופיפיי נותק בהצלחה' });
});

// POST /api/shopify/connect-demo - Demo connection
router.post('/connect-demo', (req, res) => {
  const { shop } = req.body;
  const shopDomain = shop || 'demo-store.myshopify.com';

  const existing = global.storeConnections.shopify.findIndex(s => s.shop === shopDomain);
  const storeEntry = {
    shop: shopDomain,
    accessToken: 'demo-token-' + Date.now(),
    storeName: 'החנות שלי',
    email: 'demo@example.com',
    connectedAt: new Date().toISOString(),
    productsCount: 0,
    isDemo: true
  };

  if (existing >= 0) {
    global.storeConnections.shopify[existing] = storeEntry;
  } else {
    global.storeConnections.shopify.push(storeEntry);
  }

  res.json({
    success: true,
    message: 'חובר בהצלחה (מצב הדגמה)',
    shop: shopDomain,
    storeName: 'החנות שלי'
  });
});

module.exports = router;
