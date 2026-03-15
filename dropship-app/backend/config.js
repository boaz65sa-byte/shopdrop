const fs = require('fs');
const path = require('path');

const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const CONFIG_FILE = path.join(dataDir, 'config.json');

const DEFAULTS = {
  adminPassword: 'admin123',
  ebay: {
    clientId: '',
    clientSecret: '',
    redirectUri: 'http://localhost:3001/api/ebay/callback',
    env: 'sandbox'
  },
  shopify: {
    apiKey: '',
    apiSecret: '',
    redirectUri: 'http://localhost:3001/api/shopify/callback'
  },
  amazon: {
    clientId: '',
    clientSecret: '',
    redirectUri: 'http://localhost:3001/api/amazon/callback',
    marketplace: 'A1F83G8C2ARO7P'
  },
  etsy: {
    clientId: '',
    redirectUri: 'http://localhost:3001/api/etsy/callback'
  },
  autods: {
    email: '',
    apiToken: '',
    partnerId: ''
  },
  general: {
    usdToIls: 3.75,
    defaultMarkup: 50,
    shippingBuffer: 2,
    frontendUrl: 'http://localhost:5173',
    businessName: 'בועז סעדה פתרונות יצירתיים',
    businessDomain: 'bs-simple.com',
    ownerEmail: 'boaz65sa@gmail.com'
  }
};

function mergeDeep(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source || {})) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = mergeDeep(target[key] || {}, source[key]);
    } else if (source[key] !== undefined && source[key] !== null) {
      result[key] = source[key];
    }
  }
  return result;
}

function load() {
  let saved = {};
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Config load error:', e.message);
  }

  // Merge saved config with defaults, then overlay process.env
  const merged = mergeDeep(DEFAULTS, saved);

  // process.env takes highest priority (set manually)
  if (process.env.EBAY_CLIENT_ID)     merged.ebay.clientId     = process.env.EBAY_CLIENT_ID;
  if (process.env.EBAY_CLIENT_SECRET) merged.ebay.clientSecret = process.env.EBAY_CLIENT_SECRET;
  if (process.env.EBAY_ENV)           merged.ebay.env          = process.env.EBAY_ENV;
  if (process.env.SHOPIFY_API_KEY)    merged.shopify.apiKey    = process.env.SHOPIFY_API_KEY;
  if (process.env.SHOPIFY_API_SECRET) merged.shopify.apiSecret = process.env.SHOPIFY_API_SECRET;
  if (process.env.AMAZON_CLIENT_ID)   merged.amazon.clientId   = process.env.AMAZON_CLIENT_ID;
  if (process.env.AMAZON_CLIENT_SECRET) merged.amazon.clientSecret = process.env.AMAZON_CLIENT_SECRET;
  if (process.env.ETSY_CLIENT_ID)     merged.etsy.clientId     = process.env.ETSY_CLIENT_ID;
  if (process.env.FRONTEND_URL)       merged.general.frontendUrl = process.env.FRONTEND_URL;

  return merged;
}

function save(config) {
  // Never save the adminPassword in plaintext if it wasn't changed
  const dataDir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  // Update in-memory global
  global.appConfig = mergeDeep(global.appConfig || {}, config);
}

function get() {
  return global.appConfig || DEFAULTS;
}

// Initialize
global.appConfig = load();

module.exports = { load, save, get, DEFAULTS };
