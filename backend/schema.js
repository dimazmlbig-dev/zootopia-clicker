const { log } = require("./logger");

const LOCK_ID = 220042;
let ensured = false;

async function ensureSchema(pool) {
  if (ensured) return;

  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        tg_user_id BIGINT UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS wallet_links (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        wallet_address TEXT UNIQUE NOT NULL,
        is_primary BOOLEAN DEFAULT TRUE,
        linked_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS player_state (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        state_json JSONB NOT NULL,
        version INTEGER NOT NULL DEFAULT 0,
        last_tick_ts BIGINT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        key TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, key, endpoint)
      );
    `);

    ensured = true;
    log("info", "Schema ensured");
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]);
    client.release();
  }
}

module.exports = { ensureSchema };
