const jwt = require('jsonwebtoken');

function getSecret() {
  return global.appConfig?.jwtSecret || process.env.JWT_SECRET || 'shopdrop-secret-change-me';
}

// Require valid JWT
function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'נדרשת כניסה לחשבון' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, getSecret());
    next();
  } catch {
    return res.status(401).json({ error: 'טוקן לא תקף – נא להתחבר מחדש' });
  }
}

// Require superadmin role
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'גישה מותרת לאדמין בלבד' });
    }
    next();
  });
}

// Require approved seller (or superadmin)
function requireApproved(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.status !== 'approved') {
      return res.status(403).json({ error: 'חשבונך ממתין לאישור', status: req.user.status });
    }
    next();
  });
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status },
    getSecret(),
    { expiresIn: '7d' }
  );
}

module.exports = { requireAuth, requireAdmin, requireApproved, signToken };
