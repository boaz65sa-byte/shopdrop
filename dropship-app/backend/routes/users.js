const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin, requireApproved, signToken } = require('../middleware/auth');

// GET /api/users – all users (admin)
router.get('/', requireAdmin, (req, res) => {
  const users = db.prepare(`
    SELECT u.*,
      (SELECT COUNT(*) FROM store_requests WHERE user_id = u.id) as store_count,
      (SELECT COUNT(*) FROM store_requests WHERE user_id = u.id AND status = 'pending') as pending_stores
    FROM users u
    ORDER BY u.created_at DESC
  `).all();

  res.json({
    users: users.map(u => ({ ...u, password_hash: undefined })),
    stats: {
      total:    users.length,
      pending:  users.filter(u => u.status === 'pending').length,
      approved: users.filter(u => u.status === 'approved').length,
      rejected: users.filter(u => u.status === 'rejected').length,
      blocked:  users.filter(u => u.status === 'blocked').length,
    }
  });
});

// GET /api/users/stores – all store requests (admin)
router.get('/stores', requireAdmin, (req, res) => {
  const stores = db.prepare(`
    SELECT sr.*, u.name as user_name, u.email as user_email
    FROM store_requests sr
    JOIN users u ON u.id = sr.user_id
    ORDER BY sr.created_at DESC
  `).all();

  res.json({
    stores,
    stats: {
      total:    stores.length,
      pending:  stores.filter(s => s.status === 'pending').length,
      approved: stores.filter(s => s.status === 'approved').length,
      rejected: stores.filter(s => s.status === 'rejected').length,
    }
  });
});

// PATCH /api/users/:id/status – approve / reject / block (admin)
router.patch('/:id/status', requireAdmin, (req, res) => {
  const { status, notes } = req.body;
  const valid = ['pending', 'approved', 'rejected', 'blocked'];
  if (!valid.includes(status))
    return res.status(400).json({ error: 'סטטוס לא חוקי' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' });
  if (user.role === 'superadmin')
    return res.status(400).json({ error: 'לא ניתן לשנות סטטוס של superadmin' });

  db.prepare('UPDATE users SET status = ?, notes = ? WHERE id = ?')
    .run(status, notes || user.notes, req.params.id);

  res.json({ success: true, message: `המשתמש ${status === 'approved' ? 'אושר' : status === 'rejected' ? 'נדחה' : 'עודכן'}` });
});

// PATCH /api/users/stores/:id/status – approve/reject store (admin)
router.patch('/stores/:id/status', requireAdmin, (req, res) => {
  const { status, adminNotes } = req.body;
  const valid = ['pending', 'approved', 'rejected'];
  if (!valid.includes(status))
    return res.status(400).json({ error: 'סטטוס לא חוקי' });

  const store = db.prepare('SELECT * FROM store_requests WHERE id = ?').get(req.params.id);
  if (!store) return res.status(404).json({ error: 'חנות לא נמצאה' });

  db.prepare('UPDATE store_requests SET status = ?, admin_notes = ?, reviewed_at = datetime("now") WHERE id = ?')
    .run(status, adminNotes || null, req.params.id);

  res.json({ success: true, message: `החנות ${status === 'approved' ? 'אושרה' : 'נדחתה'}` });
});

// POST /api/users/stores – request new store (seller)
router.post('/stores', requireApproved, (req, res) => {
  const { platform, storeName, storeUrl } = req.body;
  if (!platform || !storeName)
    return res.status(400).json({ error: 'פלטפורמה ושם חנות הם שדות חובה' });

  const result = db.prepare(`
    INSERT INTO store_requests (user_id, platform, store_name, store_url)
    VALUES (?, ?, ?, ?)
  `).run(req.user.id, platform, storeName, storeUrl || null);

  const store = db.prepare('SELECT * FROM store_requests WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ store, message: 'בקשת החנות נשלחה לאישור' });
});

// GET /api/users/overview – dashboard stats (admin)
router.get('/overview', requireAdmin, (req, res) => {
  const totalUsers    = db.prepare('SELECT COUNT(*) as c FROM users WHERE role = "seller"').get().c;
  const pendingUsers  = db.prepare('SELECT COUNT(*) as c FROM users WHERE status = "pending" AND role = "seller"').get().c;
  const approvedUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE status = "approved"').get().c;
  const totalStores   = db.prepare('SELECT COUNT(*) as c FROM store_requests').get().c;
  const pendingStores = db.prepare('SELECT COUNT(*) as c FROM store_requests WHERE status = "pending"').get().c;
  const recentUsers   = db.prepare('SELECT id, name, email, status, created_at FROM users WHERE role = "seller" ORDER BY created_at DESC LIMIT 5').all();

  res.json({ totalUsers, pendingUsers, approvedUsers, totalStores, pendingStores, recentUsers });
});

module.exports = router;
