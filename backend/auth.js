const crypto = require("crypto");
const { log } = require("./logger");

const ONE_DAY_SECONDS = 24 * 60 * 60;

function makeAuthError(message, status = 401, code = "unauthorized") {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function parseInitData(initData) {
  const params = new URLSearchParams(initData);
  const data = {};
  for (const [key, value] of params.entries()) {
    data[key] = value;
  }
  return data;
}

function buildDataCheckString(data) {
  const entries = Object.entries(data)
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b));

  return entries.map(([key, value]) => `${key}=${value}`).join("\n");
}

function verifyInitData(initData) {
  const botToken = process.env.BOT_TOKEN;
  if (!botToken) throw new Error("BOT_TOKEN is required");

  const data = parseInitData(initData);
  const authDate = Number(data.auth_date || 0);
  if (!authDate || Number.isNaN(authDate)) {
    throw makeAuthError("Invalid auth_date", 400, "invalid_auth_date");
  }
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > ONE_DAY_SECONDS) {
    throw makeAuthError("initData expired", 401, "init_data_expired");
  }

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const dataCheckString = buildDataCheckString(data);
  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (expectedHash !== data.hash) {
    throw makeAuthError("Invalid initData hash", 401, "invalid_signature");
  }

  const user = data.user ? JSON.parse(data.user) : null;
  if (!user || !user.id) {
    throw makeAuthError("User data missing", 400, "user_missing");
  }

  return {
    tg_user_id: user.id,
    username: user.username || null,
    first_name: user.first_name || null,
  };
}

function base64UrlEncode(input) {
  return Buffer.from(JSON.stringify(input))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(padded, "base64").toString("utf8");
  return JSON.parse(json);
}

function signToken(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");

  const header = { alg: "HS256", typ: "JWT" };
  const body = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedBody = base64UrlEncode(body);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedBody}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedBody}.${signature}`;
}

function verifyToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required");
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) throw new Error("Invalid token");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (expected !== signature) {
    const error = new Error("Invalid token signature");
    error.status = 401;
    error.code = "unauthorized";
    throw error;
  }

  const payload = base64UrlDecode(body);
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    const error = new Error("Token expired");
    error.status = 401;
    error.code = "unauthorized";
    throw error;
  }
  return payload;
}

async function createOrUpdateUser(user) {
  const { getPool } = require("./db");
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO users (tg_user_id, username, first_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (tg_user_id)
     DO UPDATE SET username = EXCLUDED.username, first_name = EXCLUDED.first_name, last_login_at = NOW()
     RETURNING *`,
    [user.tg_user_id, user.username, user.first_name]
  );
  return rows[0];
}

async function authenticateTelegram(initData) {
  const user = verifyInitData(initData);
  const dbUser = await createOrUpdateUser(user);
  const token = signToken({ sub: dbUser.id, tg_user_id: dbUser.tg_user_id });
  log("info", "User authenticated", { userId: dbUser.id });
  return { token, user: dbUser };
}

function getAuthUserId(authHeader) {
  if (!authHeader) {
    const error = new Error("Missing Authorization header");
    error.status = 401;
    error.code = "unauthorized";
    throw error;
  }
  const [, token] = authHeader.split(" ");
  if (!token) {
    const error = new Error("Invalid Authorization header");
    error.status = 401;
    error.code = "unauthorized";
    throw error;
  }
  const payload = verifyToken(token);
  return payload.sub;
}

module.exports = {
  authenticateTelegram,
  getAuthUserId,
  verifyInitData,
  signToken,
  verifyToken,
};
