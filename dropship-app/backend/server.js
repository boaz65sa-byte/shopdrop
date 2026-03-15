require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load global config FIRST
require('./config');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// Init DB (creates tables + superadmin)
require('./db');

// In-memory store for OAuth connections (per user)
global.storeConnections = {
  ebay: null,
  shopify: [],
  amazon: null,
  etsy: null,
  woocommerce: [],
  autods: null
};

const FRONTEND_URL = () => global.appConfig?.general?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // same-origin / curl
    const allowed = [
      FRONTEND_URL(),
      'http://localhost:5173',
      'http://localhost:4173',
    ];
    // Allow any Vercel preview/production URL for this project
    const isVercel = /https:\/\/shopdrop[^.]*\.vercel\.app$/.test(origin);
    if (allowed.includes(origin) || isVercel) callback(null, true);
    else callback(null, false);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/users',       require('./routes/users'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/ebay',        require('./routes/ebay'));
app.use('/api/shopify',     require('./routes/shopify'));
app.use('/api/amazon',      require('./routes/amazon'));
app.use('/api/etsy',        require('./routes/etsy'));
app.use('/api/woocommerce', require('./routes/woocommerce'));
app.use('/api/autods',      require('./routes/autods'));
app.use('/api/products',    require('./routes/products'));
app.use('/api/orders',      require('./routes/orders'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n🚀 DropShip IL רץ על פורט ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend: http://localhost:5173\n`);
});
