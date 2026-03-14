const express = require('express');
const router = express.Router();
const axios = require('axios');

const EBAY_CLIENT_ID = process.env.EBAY_CLIENT_ID || '';
const EBAY_CLIENT_SECRET = process.env.EBAY_CLIENT_SECRET || '';
const EBAY_REDIRECT_URI = process.env.EBAY_REDIRECT_URI || 'http://localhost:3001/api/ebay/callback';
const EBAY_ENV = process.env.EBAY_ENV || 'sandbox';

const EBAY_AUTH_URL = EBAY_ENV === 'production'
  ? 'https://auth.ebay.com/oauth2/authorize'
  : 'https://auth.sandbox.ebay.com/oauth2/authorize';

const EBAY_TOKEN_URL = EBAY_ENV === 'production'
  ? 'https://api.ebay.com/identity/v1/oauth2/token'
  : 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';

// Mock eBay products for demo
const mockEbayProducts = [
  {
    id: 'ebay-001',
    title: 'שעון חכם עמיד למים עם מד לחץ דם',
    price: 89.99,
    currency: 'ILS',
    image: 'https://picsum.photos/seed/ebay1/400/300',
    status: 'ACTIVE',
    quantity: 15,
    views: 234,
    sales: 12
  },
  {
    id: 'ebay-002',
    title: 'אוזניות בלוטות\' ביטול רעשים פרימיום',
    price: 149.90,
    currency: 'ILS',
    image: 'https://picsum.photos/seed/ebay2/400/300',
    status: 'ACTIVE',
    quantity: 8,
    views: 567,
    sales: 34
  },
  {
    id: 'ebay-003',
    title: 'מטען אלחוטי מהיר 15W',
    price: 45.00,
    currency: 'ILS',
    image: 'https://picsum.photos/seed/ebay3/400/300',
    status: 'ACTIVE',
    quantity: 25,
    views: 189,
    sales: 8
  }
];

// GET /api/ebay/auth-url
router.get('/auth-url', (req, res) => {
  if (!EBAY_CLIENT_ID) {
    return res.json({
      url: null,
      message: 'eBay Client ID לא מוגדר. הוסף EBAY_CLIENT_ID ל-.env',
      configured: false
    });
  }

  const scopes = [
    'https://api.ebay.com/oauth/api_scope',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.account',
    'https://api.ebay.com/oauth/api_scope/sell.fulfillment'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: EBAY_CLIENT_ID,
    redirect_uri: EBAY_REDIRECT_URI,
    response_type: 'code',
    scope: scopes,
    prompt: 'login'
  });

  const url = `${EBAY_AUTH_URL}?${params.toString()}`;
  res.json({ url, configured: true });
});

// GET /api/ebay/callback
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}?ebay_error=${error}`);
  }

  if (!code) {
    return res.redirect(`${frontendUrl}?ebay_error=no_code`);
  }

  try {
    const credentials = Buffer.from(`${EBAY_CLIENT_ID}:${EBAY_CLIENT_SECRET}`).toString('base64');

    const response = await axios.post(EBAY_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: EBAY_REDIRECT_URI
      }),
      {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

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

// GET /api/ebay/status
router.get('/status', (req, res) => {
  const conn = global.storeConnections.ebay;
  if (conn) {
    res.json({
      connected: true,
      username: conn.username,
      storeName: conn.storeName,
      connectedAt: conn.connectedAt,
      productsCount: 3,
      totalSales: 54
    });
  } else {
    res.json({ connected: false });
  }
});

// GET /api/ebay/products
router.get('/products', (req, res) => {
  res.json({
    products: mockEbayProducts,
    total: mockEbayProducts.length
  });
});

// POST /api/ebay/list-product
router.post('/list-product', async (req, res) => {
  const { productId, title, price, description, quantity } = req.body;

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));

  if (!global.storeConnections.ebay) {
    return res.status(401).json({ error: 'לא מחובר לאיביי' });
  }

  res.json({
    success: true,
    listingId: 'ebay-listing-' + Date.now(),
    title: title,
    url: `https://www.ebay.com/itm/listing-${Date.now()}`,
    message: 'המוצר פורסם בהצלחה באיביי'
  });
});

// DELETE /api/ebay/disconnect
router.delete('/disconnect', (req, res) => {
  global.storeConnections.ebay = null;
  res.json({ success: true, message: 'החיבור לאיביי נותק בהצלחה' });
});

// POST /api/ebay/connect-demo - Demo connection without real OAuth
router.post('/connect-demo', (req, res) => {
  global.storeConnections.ebay = {
    accessToken: 'demo-token-' + Date.now(),
    username: 'demo_seller_il',
    storeName: 'החנות שלי באיביי',
    connectedAt: new Date().toISOString(),
    isDemo: true
  };
  res.json({
    success: true,
    message: 'חובר בהצלחה (מצב הדגמה)',
    username: 'demo_seller_il'
  });
});

module.exports = router;
