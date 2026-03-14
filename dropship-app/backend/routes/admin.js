const express = require('express');
const router = express.Router();
const { get, save } = require('../config');

// Simple token store (in-memory)
const activeSessions = new Set();

function authMiddleware(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'לא מורשה – נדרשת כניסה לאדמין' });
  }
  next();
}

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  const cfg = get();

  if (password !== cfg.adminPassword) {
    return res.status(401).json({ error: 'סיסמה שגויה' });
  }

  const token = 'admin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 12);
  activeSessions.add(token);

  // Auto-expire after 24h
  setTimeout(() => activeSessions.delete(token), 24 * 60 * 60 * 1000);

  res.json({ success: true, token });
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token) activeSessions.delete(token);
  res.json({ success: true });
});

// GET /api/admin/config
router.get('/config', authMiddleware, (req, res) => {
  const cfg = get();

  // Mask secret values – show only first/last chars
  const mask = (v) => {
    if (!v || v.length < 4) return v ? '••••' : '';
    return v.substr(0, 4) + '••••••••' + v.substr(-3);
  };

  res.json({
    adminPasswordSet: !!cfg.adminPassword,
    ebay: {
      clientId: cfg.ebay.clientId,
      clientSecret: mask(cfg.ebay.clientSecret),
      clientSecretSet: !!cfg.ebay.clientSecret,
      redirectUri: cfg.ebay.redirectUri,
      env: cfg.ebay.env
    },
    shopify: {
      apiKey: cfg.shopify.apiKey,
      apiSecret: mask(cfg.shopify.apiSecret),
      apiSecretSet: !!cfg.shopify.apiSecret,
      redirectUri: cfg.shopify.redirectUri
    },
    amazon: {
      clientId: cfg.amazon.clientId,
      clientSecret: mask(cfg.amazon.clientSecret),
      clientSecretSet: !!cfg.amazon.clientSecret,
      redirectUri: cfg.amazon.redirectUri,
      marketplace: cfg.amazon.marketplace
    },
    etsy: {
      clientId: cfg.etsy.clientId,
      redirectUri: cfg.etsy.redirectUri
    },
    autods: {
      email: cfg.autods.email,
      apiTokenSet: !!cfg.autods.apiToken,
      partnerId: cfg.autods.partnerId
    },
    general: { ...cfg.general }
  });
});

// POST /api/admin/config
router.post('/config', authMiddleware, (req, res) => {
  const current = get();
  const updates = req.body;

  const newConfig = {
    adminPassword: updates.adminPassword || current.adminPassword,
    ebay: {
      clientId:     updates.ebay?.clientId     ?? current.ebay.clientId,
      clientSecret: updates.ebay?.clientSecret && updates.ebay.clientSecret !== '••••••••'
                      ? updates.ebay.clientSecret
                      : current.ebay.clientSecret,
      redirectUri:  updates.ebay?.redirectUri  ?? current.ebay.redirectUri,
      env:          updates.ebay?.env          ?? current.ebay.env
    },
    shopify: {
      apiKey:    updates.shopify?.apiKey    ?? current.shopify.apiKey,
      apiSecret: updates.shopify?.apiSecret && updates.shopify.apiSecret !== '••••••••'
                   ? updates.shopify.apiSecret
                   : current.shopify.apiSecret,
      redirectUri: updates.shopify?.redirectUri ?? current.shopify.redirectUri
    },
    amazon: {
      clientId:     updates.amazon?.clientId     ?? current.amazon.clientId,
      clientSecret: updates.amazon?.clientSecret && updates.amazon.clientSecret !== '••••••••'
                      ? updates.amazon.clientSecret
                      : current.amazon.clientSecret,
      redirectUri:  updates.amazon?.redirectUri  ?? current.amazon.redirectUri,
      marketplace:  updates.amazon?.marketplace  ?? current.amazon.marketplace
    },
    etsy: {
      clientId:    updates.etsy?.clientId    ?? current.etsy.clientId,
      redirectUri: updates.etsy?.redirectUri ?? current.etsy.redirectUri
    },
    autods: {
      email:     updates.autods?.email     ?? current.autods.email,
      apiToken:  updates.autods?.apiToken  && updates.autods.apiToken !== '••••••••'
                   ? updates.autods.apiToken
                   : current.autods.apiToken,
      partnerId: updates.autods?.partnerId ?? current.autods.partnerId
    },
    general: {
      usdToIls:       parseFloat(updates.general?.usdToIls)       || current.general.usdToIls,
      defaultMarkup:  parseFloat(updates.general?.defaultMarkup)  || current.general.defaultMarkup,
      shippingBuffer: parseFloat(updates.general?.shippingBuffer) ?? current.general.shippingBuffer,
      frontendUrl:    updates.general?.frontendUrl ?? current.general.frontendUrl
    }
  };

  save(newConfig);
  res.json({ success: true, message: 'ההגדרות נשמרו בהצלחה' });
});

// GET /api/admin/checklist – what's configured vs missing
router.get('/checklist', authMiddleware, (req, res) => {
  const cfg = get();
  const conn = global.storeConnections || {};

  res.json({
    items: [
      { id: 'ebay_keys',    label: 'eBay API Keys',        done: !!cfg.ebay.clientId && !!cfg.ebay.clientSecret,   priority: 'high' },
      { id: 'shopify_keys', label: 'Shopify API Keys',     done: !!cfg.shopify.apiKey && !!cfg.shopify.apiSecret,  priority: 'high' },
      { id: 'amazon_keys',  label: 'Amazon SP-API Keys',   done: !!cfg.amazon.clientId,                            priority: 'medium' },
      { id: 'etsy_keys',    label: 'Etsy API Key',         done: !!cfg.etsy.clientId,                              priority: 'medium' },
      { id: 'autods',       label: 'AutoDS חיבור',         done: !!cfg.autods.apiToken || !!cfg.autods.email,      priority: 'high' },
      { id: 'ebay_conn',    label: 'eBay מחובר',           done: !!conn.ebay,                                       priority: 'high' },
      { id: 'shopify_conn', label: 'Shopify מחובר',        done: (conn.shopify?.length || 0) > 0,                  priority: 'high' },
      { id: 'markup',       label: 'אחוז רווח מוגדר',     done: cfg.general.defaultMarkup > 0,                     priority: 'low' },
      { id: 'exchange',     label: 'שקלול שקל/דולר',      done: cfg.general.usdToIls > 0,                          priority: 'low' },
    ]
  });
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
