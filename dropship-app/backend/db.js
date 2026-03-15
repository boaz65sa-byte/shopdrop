const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role          TEXT NOT NULL DEFAULT 'seller'
                    CHECK(role IN ('seller', 'superadmin')),
      status        TEXT NOT NULL DEFAULT 'pending'
                    CHECK(status IN ('pending', 'approved', 'rejected', 'blocked')),
      phone         TEXT,
      business_name TEXT,
      notes         TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login    TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS store_requests (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform    TEXT NOT NULL,
      store_name  TEXT NOT NULL,
      store_url   TEXT,
      status      TEXT NOT NULL DEFAULT 'pending'
                  CHECK(status IN ('pending', 'approved', 'rejected')),
      admin_notes TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS user_products (
      id               SERIAL PRIMARY KEY,
      user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      source_id        TEXT,
      title            TEXT NOT NULL,
      supplier_price   NUMERIC,
      cost_price       NUMERIC,
      selling_price    NUMERIC,
      markup_percent   NUMERIC DEFAULT 50,
      currency         TEXT DEFAULT 'USD',
      image            TEXT,
      images           TEXT,
      supplier         TEXT,
      rating           NUMERIC,
      category         TEXT,
      description      TEXT,
      status           TEXT DEFAULT 'draft',
      published_stores TEXT DEFAULT '[]',
      created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function seedSuperAdmin() {
  const cfg = global.appConfig || {};
  const email    = cfg.superadminEmail    || process.env.SUPERADMIN_EMAIL    || 'boaz65sa@gmail.com';
  const password = cfg.superadminPassword || process.env.SUPERADMIN_PASSWORD || 'Admin123!';

  const { rows } = await pool.query("SELECT id FROM users WHERE role = 'superadmin'");
  if (rows.length === 0) {
    const hash = bcrypt.hashSync(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash, role, status) VALUES ($1, $2, $3, 'superadmin', 'approved')",
      ['בועז סעדה', email, hash]
    );
    console.log(`\n SuperAdmin created: ${email}\n`);
  }
}

initSchema()
  .then(seedSuperAdmin)
  .catch(err => console.error('DB init error:', err.message));

module.exports = pool;
