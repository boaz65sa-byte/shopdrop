const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { requireApproved, requireAuth } = require('../middleware/auth');
const db = require('../db');

// Mock supplier products (AliExpress-like)
const mockSearchProducts = [
  { id: 'ali-001', title: 'שעון חכם ספורט עמיד למים IP68 עם מדידת דופק', titleEn: 'Smart Sport Watch IP68 Waterproof Heart Rate Monitor', supplierPrice: 18.50, currency: 'USD', image: 'https://picsum.photos/seed/watch1/400/400', images: ['https://picsum.photos/seed/watch1/400/400', 'https://picsum.photos/seed/watch2/400/400'], supplier: 'Shenzhen Tech Co.', rating: 4.7, reviews: 2341, orders: 5670, shippingDays: '12-20', shippingCost: 0, category: 'electronics', stock: 999, weight: '0.08 ק"ג' },
  { id: 'ali-002', title: 'אוזניות TWS אלחוטיות עם ביטול רעשים ANC', titleEn: 'TWS Wireless Earbuds Active Noise Cancellation', supplierPrice: 22.80, currency: 'USD', image: 'https://picsum.photos/seed/earbuds1/400/400', images: ['https://picsum.photos/seed/earbuds1/400/400'], supplier: 'Guangzhou Audio Tech', rating: 4.5, reviews: 1876, orders: 3420, shippingDays: '10-18', shippingCost: 0, category: 'electronics', stock: 500, weight: '0.05 ק"ג' },
  { id: 'ali-003', title: 'מטען אלחוטי מהיר 15W Qi לאייפון ואנדרואיד', titleEn: 'Fast 15W Qi Wireless Charger for iPhone Android', supplierPrice: 8.90, currency: 'USD', image: 'https://picsum.photos/seed/charger1/400/400', images: ['https://picsum.photos/seed/charger1/400/400'], supplier: 'Dongguan Power Co.', rating: 4.6, reviews: 3201, orders: 8900, shippingDays: '8-15', shippingCost: 0, category: 'electronics', stock: 2000, weight: '0.12 ק"ג' },
  { id: 'ali-004', title: 'תיק גב נסיעות USB עמיד למים 40 ליטר', titleEn: 'Travel Backpack USB Waterproof 40L', supplierPrice: 24.50, currency: 'USD', image: 'https://picsum.photos/seed/bag1/400/400', images: ['https://picsum.photos/seed/bag1/400/400'], supplier: 'Yiwu Bags Factory', rating: 4.4, reviews: 987, orders: 2100, shippingDays: '14-22', shippingCost: 0, category: 'bags', stock: 300, weight: '0.8 ק"ג' },
  { id: 'ali-005', title: 'מנורת LED חכמה RGB לשינה עם שלט', titleEn: 'Smart RGB LED Night Light with Remote Control', supplierPrice: 12.30, currency: 'USD', image: 'https://picsum.photos/seed/lamp1/400/400', images: ['https://picsum.photos/seed/lamp1/400/400'], supplier: 'Foshan Lighting Ltd.', rating: 4.8, reviews: 4521, orders: 12400, shippingDays: '7-14', shippingCost: 0, category: 'home', stock: 1500, weight: '0.3 ק"ג' },
  { id: 'ali-006', title: 'כיסוי טלפון שקוף עם הגנה מפני נפילה', titleEn: 'Clear Phone Case Heavy Duty Drop Protection', supplierPrice: 3.20, currency: 'USD', image: 'https://picsum.photos/seed/case1/400/400', images: ['https://picsum.photos/seed/case1/400/400'], supplier: 'Shenzhen Cases Co.', rating: 4.3, reviews: 6780, orders: 23100, shippingDays: '5-12', shippingCost: 0, category: 'accessories', stock: 5000, weight: '0.03 ק"ג' },
  { id: 'ali-007', title: 'מצלמת מיני אלחוטית 1080P לאבטחה ביתית', titleEn: 'Mini WiFi Security Camera 1080P', supplierPrice: 19.80, currency: 'USD', image: 'https://picsum.photos/seed/cam1/400/400', images: ['https://picsum.photos/seed/cam1/400/400'], supplier: 'Hikvision Suppliers', rating: 4.6, reviews: 2109, orders: 4560, shippingDays: '10-18', shippingCost: 0, category: 'electronics', stock: 800, weight: '0.1 ק"ג' },
  { id: 'ali-008', title: 'סט מברגים חשמלי 21V נטען עם מקדחה', titleEn: '21V Cordless Electric Screwdriver Drill Set', supplierPrice: 34.90, currency: 'USD', image: 'https://picsum.photos/seed/drill1/400/400', images: ['https://picsum.photos/seed/drill1/400/400'], supplier: 'Bosch Suppliers CN', rating: 4.5, reviews: 1456, orders: 3200, shippingDays: '15-25', shippingCost: 2.00, category: 'tools', stock: 200, weight: '1.2 ק"ג' },
  { id: 'ali-009', title: 'קפצנית כושר חשמלית מתקפלת לבית', titleEn: 'Electric Treadmill Foldable Home Fitness', supplierPrice: 189.00, currency: 'USD', image: 'https://picsum.photos/seed/tread1/400/400', images: ['https://picsum.photos/seed/tread1/400/400'], supplier: 'Gym Equipment Factory', rating: 4.4, reviews: 876, orders: 1200, shippingDays: '20-35', shippingCost: 25.00, category: 'sports', stock: 50, weight: '25 ק"ג' },
  { id: 'ali-010', title: 'שמן ארומתרפי אבן בשמים אולטראסוניק', titleEn: 'Ultrasonic Aromatherapy Essential Oil Diffuser', supplierPrice: 15.60, currency: 'USD', image: 'https://picsum.photos/seed/diffuser1/400/400', images: ['https://picsum.photos/seed/diffuser1/400/400'], supplier: 'Aroma Life Co.', rating: 4.7, reviews: 3456, orders: 8900, shippingDays: '8-15', shippingCost: 0, category: 'home', stock: 1000, weight: '0.5 ק"ג' },
  { id: 'ali-011', title: 'מקלדת גיימינג RGB מכנית עם תאורה אחורית', titleEn: 'RGB Mechanical Gaming Keyboard Backlit', supplierPrice: 28.40, currency: 'USD', image: 'https://picsum.photos/seed/keyboard1/400/400', images: ['https://picsum.photos/seed/keyboard1/400/400'], supplier: 'Shenzhen Gaming Gear', rating: 4.5, reviews: 2234, orders: 5600, shippingDays: '10-18', shippingCost: 0, category: 'electronics', stock: 600, weight: '0.9 ק"ג' },
  { id: 'ali-012', title: 'שמיכת כבדות 8 ק"ג להפחתת חרדה', titleEn: 'Weighted Blanket 8kg Anxiety Relief', supplierPrice: 38.50, currency: 'USD', image: 'https://picsum.photos/seed/blanket1/400/400', images: ['https://picsum.photos/seed/blanket1/400/400'], supplier: 'Comfort Home Factory', rating: 4.8, reviews: 1876, orders: 3400, shippingDays: '12-20', shippingCost: 5.00, category: 'home', stock: 300, weight: '8 ק"ג' },
  { id: 'ali-013', title: 'עט חרט לייזר CNC עץ ועור USB', titleEn: 'CNC Laser Engraver Pen Wood Leather USB', supplierPrice: 42.00, currency: 'USD', image: 'https://picsum.photos/seed/laser1/400/400', images: ['https://picsum.photos/seed/laser1/400/400'], supplier: 'DIY Tools Factory', rating: 4.3, reviews: 987, orders: 1800, shippingDays: '15-25', shippingCost: 3.00, category: 'tools', stock: 150, weight: '0.4 ק"ג' },
  { id: 'ali-014', title: 'סט תכשיטי כסף 925 שרשרת וצמיד לנשים', titleEn: 'Sterling Silver 925 Jewelry Set Necklace Bracelet', supplierPrice: 11.20, currency: 'USD', image: 'https://picsum.photos/seed/jewelry1/400/400', images: ['https://picsum.photos/seed/jewelry1/400/400'], supplier: 'Yiwu Jewelry Co.', rating: 4.6, reviews: 4321, orders: 11200, shippingDays: '8-15', shippingCost: 0, category: 'jewelry', stock: 2000, weight: '0.04 ק"ג' },
  { id: 'ali-015', title: 'מסנן אוויר HEPA 3 שלבים לחדרים', titleEn: 'HEPA Air Purifier 3-Stage Filter for Rooms', supplierPrice: 55.00, currency: 'USD', image: 'https://picsum.photos/seed/purifier1/400/400', images: ['https://picsum.photos/seed/purifier1/400/400'], supplier: 'Clean Air Factory', rating: 4.7, reviews: 1567, orders: 2900, shippingDays: '12-22', shippingCost: 8.00, category: 'home', stock: 200, weight: '3.5 ק"ג' },
  { id: 'ali-016', title: 'משקפי שמש פולארויד UV400 עבור גברים ונשים', titleEn: 'Polarized Sunglasses UV400 Men Women', supplierPrice: 7.80, currency: 'USD', image: 'https://picsum.photos/seed/glasses1/400/400', images: ['https://picsum.photos/seed/glasses1/400/400'], supplier: 'Wenzhou Optical', rating: 4.4, reviews: 5678, orders: 18900, shippingDays: '7-14', shippingCost: 0, category: 'accessories', stock: 3000, weight: '0.06 ק"ג' },
  { id: 'ali-017', title: 'מכשיר עיסוי חשמלי לצוואר וכתפיים Shiatsu', titleEn: 'Shiatsu Electric Neck Shoulder Massager', supplierPrice: 29.90, currency: 'USD', image: 'https://picsum.photos/seed/massage1/400/400', images: ['https://picsum.photos/seed/massage1/400/400'], supplier: 'Health Tech Factory', rating: 4.6, reviews: 2890, orders: 6700, shippingDays: '10-18', shippingCost: 0, category: 'health', stock: 500, weight: '0.7 ק"ג' },
  { id: 'ali-018', title: 'לוח אינדוקציה נייד 2000W בישול מהיר', titleEn: 'Portable Induction Cooktop 2000W Fast Cooking', supplierPrice: 33.00, currency: 'USD', image: 'https://picsum.photos/seed/induction1/400/400', images: ['https://picsum.photos/seed/induction1/400/400'], supplier: 'Kitchen Appliance Co.', rating: 4.5, reviews: 1234, orders: 2800, shippingDays: '12-20', shippingCost: 4.00, category: 'kitchen', stock: 400, weight: '1.8 ק"ג' },
  { id: 'ali-019', title: 'תרמוס שמירת טמפרטורה 500ml נירוסטה', titleEn: 'Stainless Steel Vacuum Thermos 500ml', supplierPrice: 9.40, currency: 'USD', image: 'https://picsum.photos/seed/thermos1/400/400', images: ['https://picsum.photos/seed/thermos1/400/400'], supplier: 'Zhejiang Thermos Co.', rating: 4.7, reviews: 8765, orders: 28000, shippingDays: '6-12', shippingCost: 0, category: 'kitchen', stock: 5000, weight: '0.35 ק"ג' },
  { id: 'ali-020', title: 'קיט אורות LED לחדר RGB עם אפליקציה 5 מטר', titleEn: 'RGB LED Strip Lights App Control 5m Room', supplierPrice: 14.20, currency: 'USD', image: 'https://picsum.photos/seed/led1/400/400', images: ['https://picsum.photos/seed/led1/400/400'], supplier: 'LED Factory Shenzhen', rating: 4.5, reviews: 6543, orders: 19800, shippingDays: '7-14', shippingCost: 0, category: 'electronics', stock: 3000, weight: '0.15 ק"ג' },
  { id: 'ali-021', title: 'מצלמת אקשן 4K ספורט עמידה למים כמו GoPro', titleEn: '4K Action Camera Waterproof Sports GoPro Style', supplierPrice: 48.00, currency: 'USD', image: 'https://picsum.photos/seed/action1/400/400', images: ['https://picsum.photos/seed/action1/400/400'], supplier: 'Action Cam Factory', rating: 4.4, reviews: 1890, orders: 3400, shippingDays: '12-20', shippingCost: 0, category: 'electronics', stock: 300, weight: '0.25 ק"ג' },
  { id: 'ali-022', title: 'מכחול שיניים חשמלי אולטרסוניק USB', titleEn: 'Ultrasonic Electric Toothbrush USB Charging', supplierPrice: 16.80, currency: 'USD', image: 'https://picsum.photos/seed/tooth1/400/400', images: ['https://picsum.photos/seed/tooth1/400/400'], supplier: 'Dental Care Factory', rating: 4.6, reviews: 4321, orders: 9800, shippingDays: '8-15', shippingCost: 0, category: 'health', stock: 1200, weight: '0.2 ק"ג' },
  { id: 'ali-023', title: 'כיסוי ספר Kindle עור מלאכותי עם תאורה', titleEn: 'Kindle PU Leather Case Cover with Light', supplierPrice: 6.50, currency: 'USD', image: 'https://picsum.photos/seed/kindle1/400/400', images: ['https://picsum.photos/seed/kindle1/400/400'], supplier: 'Accessories Plus', rating: 4.3, reviews: 2109, orders: 5600, shippingDays: '6-12', shippingCost: 0, category: 'accessories', stock: 2500, weight: '0.15 ק"ג' },
  { id: 'ali-024', title: 'מיני פרויקטור LED 1080P ביתי אלחוטי', titleEn: 'Mini LED Projector 1080P Home WiFi Wireless', supplierPrice: 65.00, currency: 'USD', image: 'https://picsum.photos/seed/projector1/400/400', images: ['https://picsum.photos/seed/projector1/400/400'], supplier: 'Projector Tech Co.', rating: 4.4, reviews: 1345, orders: 2100, shippingDays: '14-22', shippingCost: 5.00, category: 'electronics', stock: 150, weight: '0.8 ק"ג' },
  { id: 'ali-025', title: 'גרביונים כותנה לגברים סט 10 זוגות', titleEn: "Men's Cotton Socks Set 10 Pairs Multicolor", supplierPrice: 8.20, currency: 'USD', image: 'https://picsum.photos/seed/socks1/400/400', images: ['https://picsum.photos/seed/socks1/400/400'], supplier: 'Textile Factory Guangzhou', rating: 4.8, reviews: 9876, orders: 34500, shippingDays: '5-10', shippingCost: 0, category: 'clothing', stock: 10000, weight: '0.3 ק"ג' }
];

function rowToProduct(row) {
  return {
    id: row.id,
    sourceId: row.source_id,
    title: row.title,
    supplierPrice: row.supplier_price,
    costPrice: row.cost_price,
    sellingPrice: row.selling_price,
    markupPercent: row.markup_percent,
    currency: row.currency,
    image: row.image,
    images: JSON.parse(row.images || '[]'),
    supplier: row.supplier,
    rating: row.rating,
    category: row.category,
    description: row.description,
    status: row.status,
    publishedStores: JSON.parse(row.published_stores || '[]'),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// GET /api/products/search  (public – no auth needed for browsing)
router.get('/search', (req, res) => {
  const { q, category, minPrice, maxPrice, minRating } = req.query;
  let results = [...mockSearchProducts];
  if (q) {
    const query = q.toLowerCase();
    results = results.filter(p => p.title.toLowerCase().includes(query) || p.titleEn.toLowerCase().includes(query) || p.category.toLowerCase().includes(query));
  }
  if (category && category !== 'all') results = results.filter(p => p.category === category);
  if (minPrice) results = results.filter(p => p.supplierPrice >= parseFloat(minPrice));
  if (maxPrice) results = results.filter(p => p.supplierPrice <= parseFloat(maxPrice));
  if (minRating) results = results.filter(p => p.rating >= parseFloat(minRating));
  res.json({ products: results, total: results.length, categories: ['electronics', 'home', 'bags', 'accessories', 'tools', 'sports', 'health', 'kitchen', 'jewelry', 'clothing'] });
});

// GET /api/products/saved  – user's own saved products
router.get('/saved', requireApproved, (req, res) => {
  const rows = db.prepare('SELECT * FROM user_products WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  const products = rows.map(rowToProduct);
  res.json({ products, total: products.length });
});

// POST /api/products/save
router.post('/save', requireApproved, (req, res) => {
  const { sourceId, title, supplierPrice, currency, image, images, supplier, rating, category, markupPercent, description } = req.body;

  const existing = db.prepare('SELECT id FROM user_products WHERE user_id = ? AND source_id = ?').get(req.user.id, sourceId);
  if (existing) return res.status(409).json({ error: 'מוצר זה כבר נשמר' });

  const markup = parseFloat(markupPercent) || 50;
  const usdToIls = 3.75;
  const costIls = (parseFloat(supplierPrice) + 2) * usdToIls;
  const sellingPrice = parseFloat((costIls * (1 + markup / 100)).toFixed(2));

  const result = db.prepare(`
    INSERT INTO user_products (user_id, source_id, title, supplier_price, cost_price, selling_price, markup_percent, currency, image, images, supplier, rating, category, description, status, published_stores)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', '[]')
  `).run(
    req.user.id, sourceId, title, parseFloat(supplierPrice),
    parseFloat(costIls.toFixed(2)), sellingPrice, markup,
    currency || 'USD', image, JSON.stringify(images || [image]),
    supplier, rating, category,
    description || `${title} - מוצר איכותי מהספק ${supplier}`
  );

  const product = rowToProduct(db.prepare('SELECT * FROM user_products WHERE id = ?').get(result.lastInsertRowid));
  res.status(201).json({ product, message: 'המוצר נשמר בהצלחה' });
});

// GET /api/products/:id
router.get('/:id', requireApproved, (req, res) => {
  const row = db.prepare('SELECT * FROM user_products WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'מוצר לא נמצא' });
  res.json({ product: rowToProduct(row) });
});

// PUT /api/products/:id
router.put('/:id', requireApproved, (req, res) => {
  const row = db.prepare('SELECT * FROM user_products WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'מוצר לא נמצא' });

  const updates = req.body;
  let sellingPrice = row.selling_price;
  if (updates.markupPercent !== undefined) {
    sellingPrice = parseFloat((row.cost_price * (1 + parseFloat(updates.markupPercent) / 100)).toFixed(2));
  }

  db.prepare(`
    UPDATE user_products SET
      title = ?, markup_percent = ?, selling_price = ?, status = ?, description = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).run(
    updates.title ?? row.title,
    updates.markupPercent ?? row.markup_percent,
    sellingPrice,
    updates.status ?? row.status,
    updates.description ?? row.description,
    req.params.id, req.user.id
  );

  const updated = rowToProduct(db.prepare('SELECT * FROM user_products WHERE id = ?').get(req.params.id));
  res.json({ product: updated, message: 'המוצר עודכן בהצלחה' });
});

// DELETE /api/products/:id
router.delete('/:id', requireApproved, (req, res) => {
  const result = db.prepare('DELETE FROM user_products WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'מוצר לא נמצא' });
  res.json({ success: true, message: 'המוצר נמחק בהצלחה' });
});

// POST /api/products/:id/publish
router.post('/:id/publish', requireApproved, async (req, res) => {
  const { stores } = req.body;
  const row = db.prepare('SELECT * FROM user_products WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'מוצר לא נמצא' });

  await new Promise(resolve => setTimeout(resolve, 1000));

  const results = (stores || []).map(store => ({
    store, success: true,
    listingId: `listing-${store}-${Date.now()}`,
    url: store === 'ebay' ? `https://www.ebay.com/itm/${Date.now()}` : `https://${store.replace('shopify:', '')}/products/${Date.now()}`
  }));

  const existing = JSON.parse(row.published_stores || '[]');
  const merged = JSON.stringify([...new Set([...existing, ...(stores || [])])]);

  db.prepare(`UPDATE user_products SET status = 'active', published_stores = ?, updated_at = datetime('now') WHERE id = ?`).run(merged, row.id);

  const updated = rowToProduct(db.prepare('SELECT * FROM user_products WHERE id = ?').get(row.id));
  res.json({ success: true, results, product: updated, message: `המוצר פורסם בהצלחה ב-${results.length} חנויות` });
});

module.exports = router;
