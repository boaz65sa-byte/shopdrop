require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load global config FIRST (reads data/config.json + process.env)
require('./config');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory store for OAuth connections
global.storeConnections = {
  ebay: null,
  shopify: [],
  amazon: null,
  etsy: null,
  woocommerce: [],
  autods: null
};

const FRONTEND_URL = () => global.appConfig?.general?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [FRONTEND_URL(), 'http://localhost:5173', 'http://localhost:4173'];
    if (!origin || allowed.includes(origin)) callback(null, true);
    else callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/ebay',        require('./routes/ebay'));
app.use('/api/shopify',     require('./routes/shopify'));
app.use('/api/amazon',      require('./routes/amazon'));
app.use('/api/etsy',        require('./routes/etsy'));
app.use('/api/woocommerce', require('./routes/woocommerce'));
app.use('/api/autods',      require('./routes/autods'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/orders',      require('./routes/orders'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 שרת דרופ שיפינג רץ על פורט ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🔐 Admin: http://localhost:5173 → לשונית אדמין (סיסמה: admin123)\n`);
});
