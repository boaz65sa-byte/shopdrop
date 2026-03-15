const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, businessName } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'שם, אימייל וסיסמה הם שדות חובה' });

    if (password.length < 6)
      return res.status(400).json({ error: 'סיסמה חייבת להיות לפחות 6 תווים' });

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.length > 0)
      return res.status(409).json({ error: 'כתובת אימייל זו כבר רשומה' });

    const hash = bcrypt.hashSync(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, business_name, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [name, email.toLowerCase(), hash, phone || null, businessName || null]
    );
    const user = rows[0];
    const token = signToken(user);

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
      message: 'נרשמת בהצלחה! חשבונך ממתין לאישור.'
    });
  } catch (err) {
    console.error('register error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'נדרשים אימייל וסיסמה' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = rows[0];

    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

    if (user.status === 'blocked')
      return res.status(403).json({ error: 'חשבון זה חסום. פנה לתמיכה.' });

    if (user.status === 'rejected')
      return res.status(403).json({ error: 'בקשת ההצטרפות שלך נדחתה.', status: 'rejected' });

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const token = signToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }
    });
  } catch (err) {
    console.error('login error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, status, phone, business_name, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' });

    const { rows: stores } = await pool.query('SELECT * FROM store_requests WHERE user_id = $1', [user.id]);
    res.json({ user, stores });
  } catch (err) {
    console.error('me error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = rows[0];

    if (!bcrypt.compareSync(currentPassword, user.password_hash))
      return res.status(401).json({ error: 'סיסמה נוכחית שגויה' });

    if (newPassword.length < 6)
      return res.status(400).json({ error: 'סיסמה חדשה חייבת להיות לפחות 6 תווים' });

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2',
      [bcrypt.hashSync(newPassword, 10), req.user.id]);

    res.json({ success: true, message: 'הסיסמה עודכנה בהצלחה' });
  } catch (err) {
    console.error('change-password error:', err.message);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

module.exports = router;
