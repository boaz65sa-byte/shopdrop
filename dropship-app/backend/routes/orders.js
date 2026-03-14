const express = require('express');
const router = express.Router();

// Mock orders data
const mockOrders = [
  {
    id: 'ORD-2024-001',
    orderNumber: '#1001',
    customer: { name: 'יוסי כהן', email: 'yossi@example.com', phone: '050-1234567' },
    product: 'שעון חכם ספורט IP68',
    productImage: 'https://picsum.photos/seed/watch1/100/100',
    quantity: 1,
    price: 189.90,
    currency: 'ILS',
    supplier: 'Shenzhen Tech Co.',
    supplierCost: 69.50,
    profit: 120.40,
    status: 'pending',
    source: 'shopify',
    shippingAddress: 'רחוב הרצל 15, תל אביב',
    trackingNumber: null,
    notes: '',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ORD-2024-002',
    orderNumber: '#1002',
    customer: { name: 'שרה לוי', email: 'sarah@example.com', phone: '052-9876543' },
    product: 'אוזניות TWS עם ANC',
    productImage: 'https://picsum.photos/seed/earbuds1/100/100',
    quantity: 2,
    price: 259.80,
    currency: 'ILS',
    supplier: 'Guangzhou Audio Tech',
    supplierCost: 171.00,
    profit: 88.80,
    status: 'processing',
    source: 'ebay',
    shippingAddress: 'שדרות רוטשילד 22, תל אביב',
    trackingNumber: null,
    notes: 'לקוח ביקש אריזה כמתנה',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ORD-2024-003',
    orderNumber: '#1003',
    customer: { name: 'דוד מזרחי', email: 'david@example.com', phone: '054-5555555' },
    product: 'מטען אלחוטי 15W',
    productImage: 'https://picsum.photos/seed/charger1/100/100',
    quantity: 1,
    price: 79.90,
    currency: 'ILS',
    supplier: 'Dongguan Power Co.',
    supplierCost: 33.50,
    profit: 46.40,
    status: 'shipped',
    source: 'shopify',
    shippingAddress: 'רחוב בן יהודה 8, ירושלים',
    trackingNumber: 'IL123456789CN',
    notes: '',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ORD-2024-004',
    orderNumber: '#1004',
    customer: { name: 'מרים אבוטבול', email: 'miriam@example.com', phone: '053-1111111' },
    product: 'מנורת LED RGB חכמה',
    productImage: 'https://picsum.photos/seed/lamp1/100/100',
    quantity: 3,
    price: 179.70,
    currency: 'ILS',
    supplier: 'Foshan Lighting Ltd.',
    supplierCost: 138.75,
    profit: 40.95,
    status: 'completed',
    source: 'ebay',
    shippingAddress: 'רחוב הנביאים 4, חיפה',
    trackingNumber: 'IL987654321CN',
    notes: '',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ORD-2024-005',
    orderNumber: '#1005',
    customer: { name: 'אלי בן דוד', email: 'eli@example.com', phone: '058-7777777' },
    product: 'תיק גב נסיעות 40L',
    productImage: 'https://picsum.photos/seed/bag1/100/100',
    quantity: 1,
    price: 249.90,
    currency: 'ILS',
    supplier: 'Yiwu Bags Factory',
    supplierCost: 91.50,
    profit: 158.40,
    status: 'cancelled',
    source: 'shopify',
    shippingAddress: 'רחוב דיזנגוף 100, תל אביב',
    trackingNumber: null,
    notes: 'לקוח ביטל את ההזמנה',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ORD-2024-006',
    orderNumber: '#1006',
    customer: { name: 'רחל גולדברג', email: 'rachel@example.com', phone: '050-3333333' },
    product: 'שמן ארומתרפי אולטרסוניק',
    productImage: 'https://picsum.photos/seed/diffuser1/100/100',
    quantity: 2,
    price: 239.80,
    currency: 'ILS',
    supplier: 'Aroma Life Co.',
    supplierCost: 117.00,
    profit: 122.80,
    status: 'shipped',
    source: 'shopify',
    shippingAddress: 'שדרות חן 5, ראשון לציון',
    trackingNumber: 'IL555444333CN',
    notes: '',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ORD-2024-007',
    orderNumber: '#1007',
    customer: { name: 'משה פרידמן', email: 'moshe@example.com', phone: '052-2222222' },
    product: 'מקלדת גיימינג RGB',
    productImage: 'https://picsum.photos/seed/keyboard1/100/100',
    quantity: 1,
    price: 199.90,
    currency: 'ILS',
    supplier: 'Shenzhen Gaming Gear',
    supplierCost: 106.50,
    profit: 93.40,
    status: 'pending',
    source: 'ebay',
    shippingAddress: 'רחוב ויצמן 30, פתח תקווה',
    trackingNumber: null,
    notes: '',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  }
];

// In-memory orders (initialized with mock data)
let orders = [...mockOrders];

// GET /api/orders
router.get('/', (req, res) => {
  const { status, source, page = 1, limit = 20 } = req.query;

  let filtered = [...orders];

  if (status && status !== 'all') {
    filtered = filtered.filter(o => o.status === status);
  }

  if (source) {
    filtered = filtered.filter(o => o.source === source);
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = filtered.length;
  const start = (parseInt(page) - 1) * parseInt(limit);
  const paginated = filtered.slice(start, start + parseInt(limit));

  // Stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    todayOrders: orders.filter(o => new Date(o.createdAt) >= today).length,
    monthlyRevenue: orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.price, 0),
    monthlyProfit: orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.profit, 0)
  };

  res.json({ orders: paginated, total, stats });
});

// GET /api/orders/:id
router.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'הזמנה לא נמצאה' });
  res.json({ order });
});

// PUT /api/orders/:id/status
router.put('/:id/status', (req, res) => {
  const { status, notes } = req.body;
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'הזמנה לא נמצאה' });

  const validStatuses = ['pending', 'processing', 'shipped', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'סטטוס לא חוקי' });
  }

  orders[idx] = {
    ...orders[idx],
    status,
    notes: notes || orders[idx].notes,
    updatedAt: new Date().toISOString()
  };

  res.json({ order: orders[idx], message: 'סטטוס ההזמנה עודכן בהצלחה' });
});

// POST /api/orders/:id/fulfill
router.post('/:id/fulfill', (req, res) => {
  const { trackingNumber, carrier } = req.body;
  const idx = orders.findIndex(o => o.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'הזמנה לא נמצאה' });

  orders[idx] = {
    ...orders[idx],
    status: 'shipped',
    trackingNumber,
    carrier: carrier || 'China Post',
    fulfilledAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.json({ order: orders[idx], message: 'ההזמנה סומנה כנשלחה' });
});

module.exports = router;
