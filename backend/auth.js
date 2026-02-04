const crypto = require("crypto");
const { Pool } = require("pg");

const INITDATA_MAX_AGE_SEC = 60 * 60 * 24;
const TOKEN_TTL_SEC = 60 * 60 * 24 * 7;

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required");
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

function parseJson(body) {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch (err) {
    throw new Error("Invalid JSON body");
  }
}

function jsonResponse(statusCode, data, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify(data),
  };
}

function corsHeaders(event) {
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const allowList = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  let allowOrigin = "*";
  if (allowList.length && origin && allowList.includes(origin)) {
    allowOrigin = origin;
  } else if (allowList.length) {
    allowOrigin = allowList[0];
  }
  return {
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "authorization,content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  };
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function base64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signJwt(payload) {
  const secret = requireEnv("JWT_SECRET");
  const header = { alg: "HS256", typ: "JWT" };
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const data = `${headerPart}.${payloadPart}`;
  const signature = crypto.createHmac("sha256", secret).update(data).digest("base64");
  const signaturePart = signature.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${signaturePart}`;
}

function verifyJwt(token) {
  const secret = requireEnv("JWT_SECRET");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid token");
  const [headerPart, payloadPart, signaturePart] = parts;
  const data = `${headerPart}.${payloadPart}`;
  const expected = crypto.createHmac("sha256", secret).update(data).digest("base64");
  const expectedPart = expected.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const signatureBuffer = Buffer.from(signaturePart);
  const expectedBuffer = Buffer.from(expectedPart);
  if (signatureBuffer.length !== expectedBuffer.length) throw new Error("Invalid token signature");
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) throw new Error("Invalid token signature");
  const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error("Token expired");
  return payload;
}

function verifyTelegramInitData(initData) {
  const botToken = requireEnv("BOT_TOKEN");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Missing initData hash");
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const hmacBuffer = Buffer.from(hmac, "hex");
  if (hashBuffer.length !== hmacBuffer.length) throw new Error("Invalid initData signature");
  if (!crypto.timingSafeEqual(hashBuffer, hmacBuffer)) throw new Error("Invalid initData signature");

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) throw new Error("Missing auth_date");
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > INITDATA_MAX_AGE_SEC) throw new Error("initData expired");

  const userRaw = params.get("user");
  if (!userRaw) throw new Error("Missing user in initData");
  const user = JSON.parse(userRaw);
  if (!user?.id) throw new Error("Invalid user data");

  return {
    tg_user_id: Number(user.id),
    username: user.username || null,
    first_name: user.first_name || null,
  };
}

async function getUserById(poolInstance, userId) {
  const { rows } = await poolInstance.query(
    "SELECT id, tg_user_id, username, first_name, created_at, last_login_at FROM users WHERE id = $1",
    [userId]
  );
  return rows[0];
}

async function getWallets(poolInstance, userId) {
  const { rows } = await poolInstance.query(
    "SELECT id, wallet_address, is_primary, linked_at FROM wallet_links WHERE user_id = $1 ORDER BY linked_at DESC",
    [userId]
  );
  return rows;
}

function defaultState() {
  return {
    tab: "click",
    balance: 0,
    tonBalance: 0,
    energy: 1000,
    energyMax: 1000,
    level: 1,
    levelProgress: 0.35,
    mood: "happy",
    multiplier: 1,
    nftEquipped: {
      glasses: false,
      hat: false,
      collar: false,
    },
  };
}

async function handleAuthTelegram(event) {
  const payload = parseJson(event.body);
  const initData = payload.initData;
  if (!initData) throw new Error("initData is required");

  const verified = verifyTelegramInitData(initData);
  const poolInstance = getPool();
  const { rows } = await poolInstance.query(
    `INSERT INTO users (tg_user_id, username, first_name, last_login_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (tg_user_id)
     DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name, last_login_at = now()
     RETURNING id, tg_user_id, username, first_name`,
    [verified.tg_user_id, verified.username, verified.first_name]
  );
  const user = rows[0];
  const now = Math.floor(Date.now() / 1000);
  const token = signJwt({
    sub: String(user.id),
    tg_user_id: String(user.tg_user_id),
    iat: now,
    exp: now + TOKEN_TTL_SEC,
  });
  return jsonResponse(200, { ok: true, token, user });
}

function getAuthToken(event) {
  const header = event.headers?.authorization || event.headers?.Authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("Missing Bearer token");
  return match[1];
}

async function requireUser(event) {
  const token = getAuthToken(event);
  const payload = verifyJwt(token);
  const userId = Number(payload.sub);
  if (!Number.isFinite(userId)) throw new Error("Invalid token subject");
  const poolInstance = getPool();
  const user = await getUserById(poolInstance, userId);
  if (!user) throw new Error("User not found");
  return { user, poolInstance };
}

async function handleMe(event) {
  const { user, poolInstance } = await requireUser(event);
  const wallets = await getWallets(poolInstance, user.id);
  return jsonResponse(200, { ok: true, user, wallets });
}

async function handleWalletLink(event) {
  const payload = parseJson(event.body);
  const walletAddress = payload.wallet_address;
  if (!walletAddress) throw new Error("wallet_address is required");

  const { user, poolInstance } = await requireUser(event);
  const existing = await poolInstance.query(
    "SELECT user_id FROM wallet_links WHERE wallet_address = $1",
    [walletAddress]
  );
  if (existing.rows.length && existing.rows[0].user_id !== user.id) {
    return jsonResponse(409, { ok: false, error: "Wallet already linked to another user" });
  }

  await poolInstance.query(
    `INSERT INTO wallet_links (user_id, wallet_address, is_primary, linked_at)
     VALUES ($1, $2, true, now())
     ON CONFLICT (wallet_address)
     DO UPDATE SET user_id = EXCLUDED.user_id, is_primary = true, linked_at = now()`,
    [user.id, walletAddress]
  );
  const wallets = await getWallets(poolInstance, user.id);
  return jsonResponse(200, { ok: true, wallets });
}

async function handleGetState(event) {
  const { user, poolInstance } = await requireUser(event);
  const { rows } = await poolInstance.query(
    "SELECT state_json FROM player_state WHERE user_id = $1",
    [user.id]
  );
  if (!rows.length) {
    const initial = defaultState();
    await poolInstance.query(
      "INSERT INTO player_state (user_id, state_json) VALUES ($1, $2)",
      [user.id, initial]
    );
    return jsonResponse(200, { ok: true, state_json: initial });
  }
  return jsonResponse(200, { ok: true, state_json: rows[0].state_json });
}

async function handlePostState(event) {
  const { user, poolInstance } = await requireUser(event);
  const payload = parseJson(event.body);
  const state = payload.state_json ?? payload;
  if (!state || typeof state !== "object") throw new Error("state_json is required");
  const { rows } = await poolInstance.query(
    `INSERT INTO player_state (user_id, state_json)
     VALUES ($1, $2)
     ON CONFLICT (user_id)
     DO UPDATE SET state_json = EXCLUDED.state_json, updated_at = now()
     RETURNING state_json, updated_at`,
    [user.id, state]
  );
  return jsonResponse(200, { ok: true, state_json: rows[0].state_json, updated_at: rows[0].updated_at });
}

async function handler(event) {
  const headers = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers };
  }

  try {
    const { httpMethod, path } = event;

    let response;
    if (httpMethod === "POST" && path === "/auth/telegram") response = await handleAuthTelegram(event);
    if (httpMethod === "GET" && path === "/me") response = await handleMe(event);
    if (httpMethod === "POST" && path === "/wallet/link") response = await handleWalletLink(event);
    if (httpMethod === "GET" && path === "/state") response = await handleGetState(event);
    if (httpMethod === "POST" && path === "/state") response = await handlePostState(event);

    if (response) {
      return {
        ...response,
        headers: { ...headers, ...response.headers },
      };
    }

    return jsonResponse(404, { ok: false, error: "Not found" }, headers);
  } catch (err) {
    const statusCode = err.message?.includes("token") || err.message?.includes("initData") ? 401 : 400;
    return jsonResponse(statusCode, { ok: false, error: err.message || "Bad request" }, headers);
  }
}

module.exports = { handler };
