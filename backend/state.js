const { log } = require("./logger");

const ENERGY_REGEN_PER_SEC = 0.4;
const MAX_TAPS_PER_SEC = 8;
const MAX_BATCH = 20;
const UPGRADES = {
  boost_1: { cost: 100, multiplier: 2 },
  boost_2: { cost: 250, multiplier: 3 },
};
const REWARDS = {
  daily: { amount: 50 },
  streak: { amount: 20 },
};

function makeError(message, status = 400, code = "bad_request", details = null) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
}

function defaultState() {
  return {
    balance: 0,
    energy: 20,
    energyMax: 20,
    level: 1,
    levelProgress: 0,
    multiplier: 1,
    upgrades: {},
    rewards: {},
    lastTapTs: 0,
  };
}

function tickState(row, now) {
  const lastTick = row.last_tick_ts || now;
  const elapsedSec = Math.max(0, (now - lastTick) / 1000);
  const regen = Math.floor(elapsedSec * ENERGY_REGEN_PER_SEC);
  if (regen > 0) {
    row.state_json.energy = Math.min(row.state_json.energyMax, row.state_json.energy + regen);
    row.last_tick_ts = now;
  }
  return row;
}

function applyTap(row, count, now) {
  const safeCount = Math.min(MAX_BATCH, Math.max(1, count));
  const secondsSinceLastTap = row.state_json.lastTapTs
    ? (now - row.state_json.lastTapTs) / 1000
    : 999;
  const tapsPerSec = secondsSinceLastTap > 0 ? safeCount / secondsSinceLastTap : safeCount;

  if (tapsPerSec > MAX_TAPS_PER_SEC) {
    throw makeError("Too many taps", 429, "rate_limited");
  }

  const allowed = Math.min(row.state_json.energy, safeCount);
  row.state_json.energy -= allowed;
  row.state_json.balance += allowed * row.state_json.multiplier;
  row.state_json.level = Math.floor(row.state_json.balance / 100) + 1;
  row.state_json.levelProgress = (row.state_json.balance % 100) / 100;
  row.state_json.lastTapTs = now;
}

function applyUpgrade(row, upgradeId) {
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade) throw makeError("Unknown upgrade", 400, "unknown_upgrade");
  if (row.state_json.balance < upgrade.cost) {
    throw makeError("Not enough balance", 400, "insufficient_balance");
  }
  if (row.state_json.upgrades[upgradeId]) {
    throw makeError("Upgrade already purchased", 400, "already_purchased");
  }
  row.state_json.balance -= upgrade.cost;
  row.state_json.multiplier = upgrade.multiplier;
  row.state_json.upgrades[upgradeId] = true;
}

function applyReward(row, rewardId) {
  const reward = REWARDS[rewardId];
  if (!reward) throw makeError("Unknown reward", 400, "unknown_reward");
  if (row.state_json.rewards[rewardId]) {
    throw makeError("Reward already claimed", 400, "already_claimed");
  }
  row.state_json.balance += reward.amount;
  row.state_json.rewards[rewardId] = Date.now();
}

async function ensurePlayerState(userId) {
  const { getPool } = require("./db");
  const pool = getPool();
  const now = Date.now();
  const { rows } = await pool.query(
    `INSERT INTO player_state (user_id, state_json, version, last_tick_ts)
     VALUES ($1, $2, 0, $3)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING *`,
    [userId, defaultState(), now]
  );
  if (rows[0]) return rows[0];

  const result = await pool.query("SELECT * FROM player_state WHERE user_id = $1", [userId]);
  return result.rows[0];
}

async function createStateWithClient(client, userId, now) {
  const { rows } = await client.query(
    `INSERT INTO player_state (user_id, state_json, version, last_tick_ts)
     VALUES ($1, $2, 0, $3)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING *`,
    [userId, defaultState(), now]
  );

  if (rows[0]) return rows[0];

  const existing = await client.query("SELECT * FROM player_state WHERE user_id = $1", [userId]);
  return existing.rows[0];
}

async function loadState(userId) {
  const { getPool } = require("./db");
  const pool = getPool();
  const row = await ensurePlayerState(userId);
  const now = Date.now();
  const updated = tickState(row, now);

  if (updated.last_tick_ts !== row.last_tick_ts) {
    await pool.query(
      `UPDATE player_state SET state_json = $2, last_tick_ts = $3, updated_at = NOW() WHERE user_id = $1`,
      [userId, updated.state_json, updated.last_tick_ts]
    );
  }

  return { state: updated.state_json, version: updated.version, server_time: now };
}

async function applyCommand(userId, endpoint, payload) {
  const { getPool } = require("./db");
  const pool = getPool();
  const now = Date.now();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: idemRows } = await client.query(
      `INSERT INTO idempotency_keys (user_id, key, endpoint)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING key`,
      [userId, payload.idempotency_key, endpoint]
    );

    if (idemRows.length === 0) {
      const { rows: snapshotRows } = await client.query(
        "SELECT * FROM player_state WHERE user_id = $1",
        [userId]
      );
      const snapshot = tickState(snapshotRows[0], now);
      if (snapshot.last_tick_ts !== snapshotRows[0].last_tick_ts) {
        await client.query(
          `UPDATE player_state SET state_json = $2, last_tick_ts = $3, updated_at = NOW() WHERE user_id = $1`,
          [userId, snapshot.state_json, snapshot.last_tick_ts]
        );
      }
      await client.query("COMMIT");
      return { state: snapshot.state_json, version: snapshot.version, server_time: now };
    }

    const { rows: stateRows } = await client.query(
      "SELECT * FROM player_state WHERE user_id = $1 FOR UPDATE",
      [userId]
    );

    const stateRow = stateRows[0] || (await createStateWithClient(client, userId, now));
    if (!Number.isInteger(payload.version)) {
      throw makeError("version is required", 400, "version_required");
    }

    if (payload.version !== stateRow.version) {
      throw makeError("Version conflict", 409, "version_conflict", {
        current: stateRow.version,
      });
    }

    const updated = tickState(stateRow, now);

    if (endpoint === "/command/tap") {
      if (!Number.isInteger(payload.count) || payload.count <= 0) {
        throw makeError("Invalid tap count", 400, "invalid_tap_count");
      }
      applyTap(updated, payload.count, now);
    }

    if (endpoint === "/command/buy-upgrade") {
      if (!payload.upgrade_id) {
        throw makeError("upgrade_id is required", 400, "upgrade_missing");
      }
      applyUpgrade(updated, payload.upgrade_id);
    }

    if (endpoint === "/command/claim") {
      if (!payload.reward_id) {
        throw makeError("reward_id is required", 400, "reward_missing");
      }
      applyReward(updated, payload.reward_id);
    }

    const nextVersion = updated.version + 1;

    await client.query(
      `UPDATE player_state
       SET state_json = $2, version = $3, last_tick_ts = $4, updated_at = NOW()
       WHERE user_id = $1`,
      [userId, updated.state_json, nextVersion, updated.last_tick_ts]
    );

    await client.query("COMMIT");
    log("info", "Command applied", { userId, endpoint });

    return { state: updated.state_json, version: nextVersion, server_time: now };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  loadState,
  applyCommand,
  tickState,
};
