require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory store for connections
global.storeConnections = {
  ebay: null,
  shopify: [],
  amazon: null,
  etsy: null,
  woocommerce: []
};

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const ebayRoutes = require('./routes/ebay');
const shopifyRoutes = require('./routes/shopify');
const amazonRoutes = require('./routes/amazon');
const etsyRoutes = require('./routes/etsy');
const woocommerceRoutes = require('./routes/woocommerce');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');

app.use('/api/ebay', ebayRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/amazon', amazonRoutes);
app.use('/api/etsy', etsyRoutes);
app.use('/api/woocommerce', woocommerceRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 שרת דרופ שיפינג רץ על פורט ${PORT}`);
  console.log(`📡 API זמין בכתובת: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend: ${FRONTEND_URL}\n`);
});
