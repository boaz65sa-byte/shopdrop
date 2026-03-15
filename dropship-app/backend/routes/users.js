const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAdmin, requireApproved } = require('../middleware/auth');

// GET /api/users – all users (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { rows: users } = await pool.query(`
      SELECT u.*,
        (SELECT COUNT(*) FROM store_requests WHERE user_id = u.id) as store_count,
        (SELECT COUNT(*) FROM store_requests WHERE user_id = u.id AND status = 'pending') as pending_stores
      FROM users u
      ORDER BY u.created_at DESC
    `);

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
  } catch (err) {
    console.error('get users error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// GET /api/users/stores – all store requests (admin)
router.get('/stores', requireAdmin, async (req, res) => {
  try {
    const { rows: stores } = await pool.query(`
      SELECT sr.*, u.name as user_name, u.email as user_email
      FROM store_requests sr
      JOIN users u ON u.id = sr.user_id
      ORDER BY sr.created_at DESC
    `);

    res.json({
      stores,
      stats: {
        total:    stores.length,
        pending:  stores.filter(s => s.status === 'pending').length,
        approved: stores.filter(s => s.status === 'approved').length,
        rejected: stores.filter(s => s.status === 'rejected').length,
      }
    });
  } catch (err) {
    console.error('get stores error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// PATCH /api/users/:id/status – approve / reject / block (admin)
router.patch('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const valid = ['pending', 'approved', 'rejected', 'blocked'];
    if (!valid.includes(status))
      return res.status(400).json({ error: 'סטטוס לא חוקי' });

    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' });
    if (user.role === 'superadmin')
      return res.status(400).json({ error: 'לא ניתן לשנות סטטוס של superadmin' });

    await pool.query('UPDATE users SET status = $1, notes = $2 WHERE id = $3',
      [status, notes || user.notes, req.params.id]);

    res.json({ success: true, message: `המשתמש ${status === 'approved' ? 'אושר' : status === 'rejected' ? 'נדחה' : 'עודכן'}` });
  } catch (err) {
    console.error('update status error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// PATCH /api/users/stores/:id/status – approve/reject store (admin)
router.patch('/stores/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const valid = ['pending', 'approved', 'rejected'];
    if (!valid.includes(status))
      return res.status(400).json({ error: 'סטטוס לא חוקי' });

    const { rows } = await pool.query('SELECT * FROM store_requests WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'חנות לא נמצאה' });

    await pool.query(
      'UPDATE store_requests SET status = $1, admin_notes = $2, reviewed_at = NOW() WHERE id = $3',
      [status, adminNotes || null, req.params.id]
    );

    res.json({ success: true, message: `החנות ${status === 'approved' ? 'אושרה' : 'נדחתה'}` });
  } catch (err) {
    console.error('update store status error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// POST /api/users/stores – request new store (seller)
router.post('/stores', requireApproved, async (req, res) => {
  try {
    const { platform, storeName, storeUrl } = req.body;
    if (!platform || !storeName)
      return res.status(400).json({ error: 'פלטפורמה ושם חנות הם שדות חובה' });

    const { rows } = await pool.query(
      'INSERT INTO store_requests (user_id, platform, store_name, store_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, platform, storeName, storeUrl || null]
    );
    res.status(201).json({ store: rows[0], message: 'בקשת החנות נשלחה לאישור' });
  } catch (err) {
    console.error('create store error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// GET /api/users/overview – dashboard stats (admin)
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const [r1, r2, r3, r4, r5, r6] = await Promise.all([
      pool.query("SELECT COUNT(*) as c FROM users WHERE role = 'seller'"),
      pool.query("SELECT COUNT(*) as c FROM users WHERE status = 'pending' AND role = 'seller'"),
      pool.query("SELECT COUNT(*) as c FROM users WHERE status = 'approved'"),
      pool.query('SELECT COUNT(*) as c FROM store_requests'),
      pool.query("SELECT COUNT(*) as c FROM store_requests WHERE status = 'pending'"),
      pool.query("SELECT id, name, email, status, created_at FROM users WHERE role = 'seller' ORDER BY created_at DESC LIMIT 5"),
    ]);

    res.json({
      totalUsers:    parseInt(r1.rows[0].c),
      pendingUsers:  parseInt(r2.rows[0].c),
      approvedUsers: parseInt(r3.rows[0].c),
      totalStores:   parseInt(r4.rows[0].c),
      pendingStores: parseInt(r5.rows[0].c),
      recentUsers:   r6.rows,
    });
  } catch (err) {
    console.error('overview error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
