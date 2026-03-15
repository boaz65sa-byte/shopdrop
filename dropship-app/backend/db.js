const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'shopdrop.db'));

// WAL mode for better performance
db.pragma('journal_mode = WAL');

// ─── Schema ───────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    email        TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role         TEXT NOT NULL DEFAULT 'seller'
                 CHECK(role IN ('seller', 'superadmin')),
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK(status IN ('pending', 'approved', 'rejected', 'blocked')),
    phone        TEXT,
    business_name TEXT,
    notes        TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    last_login   TEXT
  );

  CREATE TABLE IF NOT EXISTS store_requests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform     TEXT NOT NULL,
    store_name   TEXT NOT NULL,
    store_url    TEXT,
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK(status IN ('pending', 'approved', 'rejected')),
    admin_notes  TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    reviewed_at  TEXT
  );

  CREATE TABLE IF NOT EXISTS user_products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_id    TEXT,
    title        TEXT NOT NULL,
    supplier_price REAL,
    cost_price   REAL,
    selling_price REAL,
    markup_percent REAL DEFAULT 50,
    currency     TEXT DEFAULT 'USD',
    image        TEXT,
    images       TEXT,
    supplier     TEXT,
    rating       REAL,
    category     TEXT,
    description  TEXT,
    status       TEXT DEFAULT 'draft',
    published_stores TEXT DEFAULT '[]',
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ─── Seed superadmin ──────────────────────────────────────
function seedSuperAdmin() {
  const cfg = global.appConfig || {};
  const email    = cfg.superadminEmail    || process.env.SUPERADMIN_EMAIL    || 'admin@shopdrop.com';
  const password = cfg.superadminPassword || process.env.SUPERADMIN_PASSWORD || 'Admin123!';
  const name     = 'Super Admin';

  const existing = db.prepare('SELECT id FROM users WHERE role = ?').get('superadmin');
  if (!existing) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`
      INSERT INTO users (name, email, password_hash, role, status)
      VALUES (?, ?, ?, 'superadmin', 'approved')
    `).run(name, email, hash);
    console.log(`\n👑 SuperAdmin נוצר: ${email} / ${password}`);
    console.log('   שנה סיסמה בפאנל האדמין לאחר הכניסה הראשונה!\n');
  }
}

seedSuperAdmin();

module.exports = db;
