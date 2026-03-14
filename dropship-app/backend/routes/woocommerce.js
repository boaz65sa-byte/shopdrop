const express = require('express');
const router = express.Router();
const axios = require('axios');

// WooCommerce uses consumer key/secret (no OAuth flow, direct API key auth)
// GET /api/woocommerce/status
router.get('/status', (req, res) => {
  const stores = global.storeConnections.woocommerce || [];
  res.json({
    connected: stores.length > 0,
    stores: stores.map(s => ({
      siteUrl: s.siteUrl,
      storeName: s.storeName,
      connectedAt: s.connectedAt,
      productsCount: s.productsCount || 0,
      isDemo: s.isDemo || false
    }))
  });
});

// POST /api/woocommerce/connect
router.post('/connect', async (req, res) => {
  const { siteUrl, consumerKey, consumerSecret } = req.body;

  if (!siteUrl || !consumerKey || !consumerSecret) {
    return res.status(400).json({ error: 'נדרש כתובת אתר, Consumer Key ו-Consumer Secret' });
  }

  const cleanUrl = siteUrl.replace(/\/$/, '');

  try {
    const response = await axios.get(
      `${cleanUrl}/wp-json/wc/v3/system_status`,
      {
        auth: { username: consumerKey, password: consumerSecret },
        timeout: 8000
      }
    );

    const storeName = response.data?.settings?.store_name || cleanUrl;

    const storeEntry = {
      siteUrl: cleanUrl,
      consumerKey,
      consumerSecret,
      storeName,
      connectedAt: new Date().toISOString(),
      productsCount: 0
    };

    if (!global.storeConnections.woocommerce) global.storeConnections.woocommerce = [];
    const existing = global.storeConnections.woocommerce.findIndex(s => s.siteUrl === cleanUrl);
    if (existing >= 0) {
      global.storeConnections.woocommerce[existing] = storeEntry;
    } else {
      global.storeConnections.woocommerce.push(storeEntry);
    }

    res.json({ success: true, message: `חובר לחנות ${storeName}`, storeName });
  } catch (err) {
    console.error('WooCommerce connect error:', err.message);
    res.status(400).json({ error: 'לא ניתן להתחבר. בדוק שה-URL וה-API keys נכונים.' });
  }
});

// POST /api/woocommerce/connect-demo
router.post('/connect-demo', (req, res) => {
  if (!global.storeConnections.woocommerce) global.storeConnections.woocommerce = [];

  const storeEntry = {
    siteUrl: 'https://my-store.example.com',
    consumerKey: 'demo-key',
    consumerSecret: 'demo-secret',
    storeName: 'החנות שלי - WordPress',
    connectedAt: new Date().toISOString(),
    productsCount: 0,
    isDemo: true
  };

  const existing = global.storeConnections.woocommerce.findIndex(s => s.siteUrl === storeEntry.siteUrl);
  if (existing >= 0) {
    global.storeConnections.woocommerce[existing] = storeEntry;
  } else {
    global.storeConnections.woocommerce.push(storeEntry);
  }

  res.json({ success: true, message: 'חובר ל-WooCommerce (מצב הדגמה)', storeName: storeEntry.storeName });
});

// POST /api/woocommerce/list-product
router.post('/list-product', async (req, res) => {
  const { siteUrl, title, price, description, imageUrl } = req.body;

  if (!global.storeConnections.woocommerce) global.storeConnections.woocommerce = [];
  const store = global.storeConnections.woocommerce.find(s => s.siteUrl === siteUrl);
  if (!store) return res.status(401).json({ error: 'חנות לא מחוברת' });

  await new Promise(resolve => setTimeout(resolve, 800));

  if (store.isDemo) {
    return res.json({
      success: true,
      productId: Date.now(),
      title,
      url: `${siteUrl}/product/${title.toLowerCase().replace(/\s+/g, '-')}`,
      message: `המוצר פורסם בחנות ${store.storeName}`
    });
  }

  try {
    const response = await axios.post(
      `${siteUrl}/wp-json/wc/v3/products`,
      {
        name: title,
        regular_price: price?.toString(),
        description: description || '',
        images: imageUrl ? [{ src: imageUrl }] : [],
        status: 'publish'
      },
      { auth: { username: store.consumerKey, password: store.consumerSecret } }
    );

    res.json({
      success: true,
      productId: response.data.id,
      title: response.data.name,
      url: response.data.permalink,
      message: `המוצר פורסם ב-${store.storeName}`
    });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בפרסום המוצר: ' + err.message });
  }
});

// DELETE /api/woocommerce/disconnect
router.delete('/disconnect', (req, res) => {
  const { siteUrl } = req.query;
  if (!global.storeConnections.woocommerce) global.storeConnections.woocommerce = [];

  if (siteUrl) {
    global.storeConnections.woocommerce = global.storeConnections.woocommerce.filter(s => s.siteUrl !== siteUrl);
  } else {
    global.storeConnections.woocommerce = [];
  }

  res.json({ success: true, message: 'החיבור ל-WooCommerce נותק' });
});

module.exports = router;
