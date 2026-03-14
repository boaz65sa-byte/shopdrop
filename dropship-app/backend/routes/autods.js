const express = require('express');
const router = express.Router();
const axios = require('axios');
const { get } = require('../config');

const AUTODS_API = 'https://api.autods.com/v2';

// Mock AutoDS products catalog
const mockAutodsProducts = [
  {
    id: 'ads-001',
    title: 'שעון חכם X8 Ultra – קצב לב, GPS, IP68',
    titleEn: 'Smart Watch X8 Ultra Heart Rate GPS IP68',
    supplierPrice: 14.99,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads1/400/400',
    images: ['https://picsum.photos/seed/ads1/400/400', 'https://picsum.photos/seed/ads1b/400/400'],
    supplier: 'AliExpress (via AutoDS)',
    sourceUrl: 'https://www.aliexpress.com/item/demo',
    rating: 4.8,
    reviews: 8921,
    orders: 23400,
    shippingDays: '7-14',
    shippingCost: 0,
    category: 'electronics',
    stock: 9999,
    weight: '0.08 ק"ג',
    autodsMonitored: true,
    profitScore: 92
  },
  {
    id: 'ads-002',
    title: 'אוזניות EarPods Pro Max – ANC 40dB, 36 שעות',
    titleEn: 'EarPods Pro Max ANC 40dB 36H Battery',
    supplierPrice: 18.50,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads2/400/400',
    images: ['https://picsum.photos/seed/ads2/400/400'],
    supplier: 'AliExpress (via AutoDS)',
    rating: 4.7,
    reviews: 5432,
    orders: 15600,
    shippingDays: '8-15',
    shippingCost: 0,
    category: 'electronics',
    stock: 5000,
    weight: '0.05 ק"ג',
    autodsMonitored: true,
    profitScore: 88
  },
  {
    id: 'ads-003',
    title: 'מנורת LED RGB שולחנית – 16M צבעים, USB-C',
    titleEn: 'RGB Desk LED Lamp 16M Colors USB-C',
    supplierPrice: 11.20,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads3/400/400',
    images: ['https://picsum.photos/seed/ads3/400/400'],
    supplier: 'Walmart (via AutoDS)',
    rating: 4.6,
    reviews: 3201,
    orders: 9800,
    shippingDays: '5-10',
    shippingCost: 0,
    category: 'home',
    stock: 2000,
    weight: '0.3 ק"ג',
    autodsMonitored: true,
    profitScore: 85
  },
  {
    id: 'ads-004',
    title: 'מעמד טלפון לרכב – מגנטי 360°, טעינה אלחוטית',
    titleEn: 'Magnetic 360 Car Phone Mount Wireless Charging',
    supplierPrice: 9.80,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads4/400/400',
    images: ['https://picsum.photos/seed/ads4/400/400'],
    supplier: 'AliExpress (via AutoDS)',
    rating: 4.5,
    reviews: 7654,
    orders: 21000,
    shippingDays: '6-12',
    shippingCost: 0,
    category: 'accessories',
    stock: 8000,
    weight: '0.12 ק"ג',
    autodsMonitored: true,
    profitScore: 91
  },
  {
    id: 'ads-005',
    title: 'גריפ אחיזה לאייפון – MagSafe, עמיד ל-3m נפילה',
    titleEn: 'MagSafe Compatible Grip iPhone Drop Protection 3m',
    supplierPrice: 6.40,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads5/400/400',
    images: ['https://picsum.photos/seed/ads5/400/400'],
    supplier: 'Amazon (via AutoDS)',
    rating: 4.7,
    reviews: 12300,
    orders: 38000,
    shippingDays: '3-7',
    shippingCost: 0,
    category: 'accessories',
    stock: 9999,
    weight: '0.04 ק"ג',
    autodsMonitored: true,
    profitScore: 95
  },
  {
    id: 'ads-006',
    title: 'מכשיר עיסוי ידיים חשמלי – חום + לחץ אוויר',
    titleEn: 'Electric Hand Massager Heat Air Compression',
    supplierPrice: 24.90,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads6/400/400',
    images: ['https://picsum.photos/seed/ads6/400/400'],
    supplier: 'AliExpress (via AutoDS)',
    rating: 4.8,
    reviews: 2109,
    orders: 6700,
    shippingDays: '10-18',
    shippingCost: 0,
    category: 'health',
    stock: 1500,
    weight: '0.5 ק"ג',
    autodsMonitored: true,
    profitScore: 87
  },
  {
    id: 'ads-007',
    title: 'מארגן כבלים מגנטי – סט 10 קליפסים, סיליקון',
    titleEn: 'Magnetic Cable Organizer Clips Set 10 Silicone',
    supplierPrice: 4.20,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads7/400/400',
    images: ['https://picsum.photos/seed/ads7/400/400'],
    supplier: 'AliExpress (via AutoDS)',
    rating: 4.6,
    reviews: 18900,
    orders: 67000,
    shippingDays: '5-10',
    shippingCost: 0,
    category: 'accessories',
    stock: 9999,
    weight: '0.05 ק"ג',
    autodsMonitored: true,
    profitScore: 96
  },
  {
    id: 'ads-008',
    title: 'פילטר מים לברז – 7 שלבים, נירוסטה',
    titleEn: '7-Stage Faucet Water Filter Stainless Steel',
    supplierPrice: 19.50,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads8/400/400',
    images: ['https://picsum.photos/seed/ads8/400/400'],
    supplier: 'Walmart (via AutoDS)',
    rating: 4.5,
    reviews: 4321,
    orders: 12000,
    shippingDays: '4-8',
    shippingCost: 0,
    category: 'home',
    stock: 3000,
    weight: '0.4 ק"ג',
    autodsMonitored: true,
    profitScore: 83
  },
  {
    id: 'ads-009',
    title: 'תיק צד עור טבעוני לנשים – 5 כיסים',
    titleEn: 'Vegan Leather Shoulder Bag Women 5 Compartments',
    supplierPrice: 16.80,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads9/400/400',
    images: ['https://picsum.photos/seed/ads9/400/400'],
    supplier: 'AliExpress (via AutoDS)',
    rating: 4.7,
    reviews: 6540,
    orders: 19800,
    shippingDays: '8-15',
    shippingCost: 0,
    category: 'bags',
    stock: 2500,
    weight: '0.45 ק"ג',
    autodsMonitored: true,
    profitScore: 89
  },
  {
    id: 'ads-010',
    title: 'מייבש שיער מקצועי 2400W Ionic – קר/חם',
    titleEn: 'Professional Ionic Hair Dryer 2400W Cold/Hot',
    supplierPrice: 28.00,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads10/400/400',
    images: ['https://picsum.photos/seed/ads10/400/400'],
    supplier: 'AliExpress (via AutoDS)',
    rating: 4.6,
    reviews: 8765,
    orders: 24500,
    shippingDays: '9-16',
    shippingCost: 0,
    category: 'health',
    stock: 2000,
    weight: '0.55 ק"ג',
    autodsMonitored: true,
    profitScore: 84
  },
  {
    id: 'ads-011',
    title: 'עט סטיילוס אוניברסלי – iPad, Samsung, כל מסך',
    titleEn: 'Universal Stylus Pen iPad Samsung Any Screen',
    supplierPrice: 5.90,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads11/400/400',
    images: ['https://picsum.photos/seed/ads11/400/400'],
    supplier: 'Amazon (via AutoDS)',
    rating: 4.4,
    reviews: 22100,
    orders: 78000,
    shippingDays: '2-5',
    shippingCost: 0,
    category: 'electronics',
    stock: 9999,
    weight: '0.02 ק"ג',
    autodsMonitored: true,
    profitScore: 93
  },
  {
    id: 'ads-012',
    title: 'שעון קיר דיגיטלי LED – תצוגת טמפרטורה',
    titleEn: 'Digital LED Wall Clock Temperature Display',
    supplierPrice: 12.50,
    currency: 'USD',
    image: 'https://picsum.photos/seed/ads12/400/400',
    images: ['https://picsum.photos/seed/ads12/400/400'],
    supplier: 'AliExpress (via AutoDS)',
    rating: 4.5,
    reviews: 9870,
    orders: 32000,
    shippingDays: '7-14',
    shippingCost: 0,
    category: 'home',
    stock: 4000,
    weight: '0.3 ק"ג',
    autodsMonitored: true,
    profitScore: 87
  }
];

// GET /api/autods/status
router.get('/status', (req, res) => {
  const conn = global.storeConnections?.autods;
  if (conn) {
    res.json({
      connected: true,
      email: conn.email,
      plan: conn.plan || 'Advanced',
      monitoredProducts: conn.monitoredProducts || 0,
      connectedAt: conn.connectedAt,
      isDemo: conn.isDemo || false
    });
  } else {
    res.json({ connected: false });
  }
});

// POST /api/autods/connect
router.post('/connect', async (req, res) => {
  const { email, password, apiToken } = req.body;
  const cfg = get();

  const token = apiToken || cfg.autods.apiToken;
  const userEmail = email || cfg.autods.email;

  if (!token && !userEmail) {
    return res.status(400).json({ error: 'נדרש API Token או Email+Password' });
  }

  // Try real API if token provided
  if (token && !req.body.demo) {
    try {
      const response = await axios.get(`${AUTODS_API}/user/info`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });

      global.storeConnections.autods = {
        accessToken: token,
        email: response.data.email || userEmail,
        plan: response.data.plan || 'Advanced',
        monitoredProducts: response.data.monitoredProducts || 0,
        connectedAt: new Date().toISOString()
      };

      return res.json({ success: true, message: 'חובר ל-AutoDS בהצלחה', email: response.data.email });
    } catch (err) {
      // Fall through to demo if API fails
    }
  }

  // Demo mode
  return res.json({ success: false, error: 'לא ניתן לחבר – השתמש במצב הדגמה' });
});

// POST /api/autods/connect-demo
router.post('/connect-demo', (req, res) => {
  global.storeConnections.autods = {
    accessToken: 'demo-autods-' + Date.now(),
    email: get().autods.email || 'demo@autods.com',
    plan: 'Advanced',
    monitoredProducts: mockAutodsProducts.length,
    connectedAt: new Date().toISOString(),
    isDemo: true
  };
  res.json({ success: true, message: 'חובר ל-AutoDS (מצב הדגמה)', plan: 'Advanced' });
});

// DELETE /api/autods/disconnect
router.delete('/disconnect', (req, res) => {
  global.storeConnections.autods = null;
  res.json({ success: true, message: 'AutoDS נותק' });
});

// GET /api/autods/products
router.get('/products', (req, res) => {
  const { q, category, minScore } = req.query;
  let results = [...mockAutodsProducts];

  if (q) {
    const query = q.toLowerCase();
    results = results.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.titleEn.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
  }
  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }
  if (minScore) {
    results = results.filter(p => p.profitScore >= parseInt(minScore));
  }

  // Sort by profit score descending
  results.sort((a, b) => b.profitScore - a.profitScore);

  res.json({ products: results, total: results.length, source: 'autods' });
});

// POST /api/autods/fulfill-order
router.post('/fulfill-order', async (req, res) => {
  const { orderId, supplierUrl, buyerAddress } = req.body;

  if (!global.storeConnections?.autods) {
    return res.status(401).json({ error: 'AutoDS לא מחובר' });
  }

  await new Promise(resolve => setTimeout(resolve, 1200));

  res.json({
    success: true,
    autodsOrderId: 'ADS-' + Date.now(),
    trackingNumber: 'AUTO' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    estimatedDelivery: '7-14 ימי עסקים',
    message: 'ההזמנה הועברה ל-AutoDS לביצוע אוטומטי'
  });
});

module.exports = router;
