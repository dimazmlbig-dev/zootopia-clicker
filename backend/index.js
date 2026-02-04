const { getPool } = require("./db");
const { ensureSchema } = require("./schema");
const { authenticateTelegram, getAuthUserId } = require("./auth");
const { loadState, applyCommand } = require("./state");
const { linkWallet, getWallets } = require("./wallet");
const { rateLimit } = require("./rate_limit");
const { log } = require("./logger");

function jsonResponse(statusCode, payload, origin) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": origin || "*",
      "access-control-allow-headers": "content-type, authorization",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    },
    body: JSON.stringify(payload),
  };
}

function errorResponse(statusCode, message, code, details, origin) {
  return jsonResponse(
    statusCode,
    { ok: false, error: message, code, details: details || null },
    origin
  );
}

function parseJson(body) {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error("Invalid JSON body");
  }
}

function getOrigin(event) {
  const whitelist = process.env.CORS_ORIGINS;
  if (!whitelist) return "*";
  const allowed = whitelist.split(",").map((item) => item.trim());
  const origin = event.headers?.origin || event.headers?.Origin;
  if (origin && allowed.includes(origin)) {
    return origin;
  }
  return allowed[0] || "*";
}

async function ensureDb() {
  await ensureSchema(getPool());
}

async function handleAuth(event, origin) {
  const payload = parseJson(event.body);
  if (!payload.initData) {
    return errorResponse(400, "initData is required", "init_data_missing", null, origin);
  }
  const result = await authenticateTelegram(payload.initData);
  return jsonResponse(200, { ok: true, ...result }, origin);
}

async function handleMe(event, origin) {
  const userId = getAuthUserId(event.headers?.authorization || event.headers?.Authorization);
  const wallets = await getWallets(userId);
  return jsonResponse(200, { ok: true, wallets }, origin);
}

async function handleWalletLink(event, origin) {
  const userId = getAuthUserId(event.headers?.authorization || event.headers?.Authorization);
  const payload = parseJson(event.body);
  if (!payload.wallet_address) {
    return errorResponse(400, "wallet_address is required", "wallet_missing", null, origin);
  }
  const wallets = await linkWallet(userId, payload.wallet_address);
  return jsonResponse(200, { ok: true, wallets }, origin);
}

async function handleState(event, origin) {
  const userId = getAuthUserId(event.headers?.authorization || event.headers?.Authorization);
  const state = await loadState(userId);
  return jsonResponse(200, { ok: true, ...state }, origin);
}

async function handleCommand(event, origin, endpoint) {
  const userId = getAuthUserId(event.headers?.authorization || event.headers?.Authorization);
  const payload = parseJson(event.body);

  if (!payload.idempotency_key) {
    return errorResponse(400, "idempotency_key is required", "idempotency_required", null, origin);
  }

  const allowed = rateLimit(`${userId}:${endpoint}`, { limit: 10, intervalMs: 1000 });
  if (!allowed) {
    return errorResponse(429, "Rate limit exceeded", "rate_limited", null, origin);
  }

  const result = await applyCommand(userId, endpoint, payload);
  return jsonResponse(200, { ok: true, ...result }, origin);
}

async function route(event) {
  await ensureDb();
  const origin = getOrigin(event);
  const method = event.httpMethod;
  const path = event.path || "/";

  if (method === "OPTIONS") {
    return jsonResponse(200, { ok: true }, origin);
  }

  if (method === "POST" && path === "/auth/telegram") {
    return handleAuth(event, origin);
  }

  if (method === "GET" && path === "/me") {
    return handleMe(event, origin);
  }

  if (method === "POST" && path === "/wallet/link") {
    return handleWalletLink(event, origin);
  }

  if (method === "GET" && path === "/state") {
    return handleState(event, origin);
  }

  if (method === "POST" && path === "/command/tap") {
    return handleCommand(event, origin, "/command/tap");
  }

  if (method === "POST" && path === "/command/buy-upgrade") {
    return handleCommand(event, origin, "/command/buy-upgrade");
  }

  if (method === "POST" && path === "/command/claim") {
    return handleCommand(event, origin, "/command/claim");
  }

  return errorResponse(404, "Not found", "not_found", null, origin);
}

module.exports.handler = async (event) => {
  try {
    return await route(event);
  } catch (error) {
    log("error", "Request failed", { error: error.message });
    const origin = getOrigin(event);
    if (error.status) {
      return errorResponse(
        error.status,
        error.message,
        error.code || "request_error",
        error.details || null,
        origin
      );
    }
    return errorResponse(500, "Internal server error", "internal_error", null, origin);
  }
};
