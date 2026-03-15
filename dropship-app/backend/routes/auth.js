const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { name, email, password, phone, businessName } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'שם, אימייל וסיסמה הם שדות חובה' });

  if (password.length < 6)
    return res.status(400).json({ error: 'סיסמה חייבת להיות לפחות 6 תווים' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing)
    return res.status(409).json({ error: 'כתובת אימייל זו כבר רשומה' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, phone, business_name, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `).run(name, email.toLowerCase(), hash, phone || null, businessName || null);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = signToken(user);

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    message: 'נרשמת בהצלחה! חשבונך ממתין לאישור.'
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'נדרשים אימייל וסיסמה' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

  if (user.status === 'blocked')
    return res.status(403).json({ error: 'חשבון זה חסום. פנה לתמיכה.' });

  if (user.status === 'rejected')
    return res.status(403).json({ error: 'בקשת ההצטרפות שלך נדחתה.', status: 'rejected' });

  db.prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id);

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status }
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, status, phone, business_name, created_at, last_login FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' });

  const stores = db.prepare('SELECT * FROM store_requests WHERE user_id = ?').all(user.id);
  res.json({ user, stores });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!bcrypt.compareSync(currentPassword, user.password_hash))
    return res.status(401).json({ error: 'סיסמה נוכחית שגויה' });

  if (newPassword.length < 6)
    return res.status(400).json({ error: 'סיסמה חדשה חייבת להיות לפחות 6 תווים' });

  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .run(bcrypt.hashSync(newPassword, 10), user.id);

  res.json({ success: true, message: 'הסיסמה עודכנה בהצלחה' });
});

module.exports = router;
