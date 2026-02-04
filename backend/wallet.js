const { getPool } = require("./db");

function normalizeAddress(address) {
  return String(address || "").trim();
}

async function linkWallet(userId, walletAddress) {
  const pool = getPool();
  const address = normalizeAddress(walletAddress);
  if (!address) throw new Error("wallet_address is required");

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE wallet_links SET is_primary = FALSE WHERE user_id = $1",
      [userId]
    );

    const { rows } = await client.query(
      `INSERT INTO wallet_links (user_id, wallet_address, is_primary)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (wallet_address)
       DO UPDATE SET user_id = EXCLUDED.user_id, is_primary = TRUE, linked_at = NOW()
       RETURNING *`,
      [userId, address]
    );

    await client.query("COMMIT");
    return rows;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function getWallets(userId) {
  const pool = getPool();
  const { rows } = await pool.query(
    "SELECT * FROM wallet_links WHERE user_id = $1 ORDER BY linked_at DESC",
    [userId]
  );
  return rows;
}

module.exports = { linkWallet, getWallets };
