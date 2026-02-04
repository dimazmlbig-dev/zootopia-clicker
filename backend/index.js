const { Pool } = require("pg");

const MARKET_FEE_BPS = 300;
const MARKET_FEE_ADDRESS = "UQCJRRRYnrs_qsA2AgIE71dPsHf_-AKaZV9UMeT4vBbh6Yes";
const TONCENTER_BASE = "https://toncenter.com/api/v3";

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required");
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  };
}

function parseJson(body) {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch (err) {
    throw new Error("Invalid JSON body");
  }
}

function requireFields(payload, fields) {
  const missing = fields.filter((f) => payload[f] === undefined || payload[f] === null || payload[f] === "");
  if (missing.length) {
    throw new Error(`Missing fields: ${missing.join(", ")}`);
  }
}

async function getNftItemByToken(poolInstance, tokenId) {
  const { rows } = await poolInstance.query(
    "SELECT token_id, nft_address, name, image, rarity, owner_address FROM nft_items WHERE token_id = $1",
    [tokenId]
  );
  return rows[0];
}

function ensureNftAddress(item) {
  if (!item) throw new Error("NFT not found");
  if (!item.nft_address) throw new Error("NFT address is missing in nft_items.json");
  return item.nft_address;
}

function buildTonConnectTx({ messages }) {
  return {
    validUntil: Math.floor(Date.now() / 1000) + 600,
    messages,
  };
}

function buildTransferComment(comment) {
  const text = Buffer.from(comment, "utf-8");
  const zero = Buffer.from([0, 0, 0, 0]);
  return Buffer.concat([zero, text]).toString("base64");
}

async function handleGetListings(event) {
  const poolInstance = getPool();
  const status = event.queryStringParameters?.status || "active";
  const { rows } = await poolInstance.query(
    "SELECT * FROM listings WHERE status = $1 ORDER BY created_at DESC",
    [status]
  );
  return jsonResponse(200, { ok: true, listings: rows });
}

async function handleGetOffers(event) {
  const poolInstance = getPool();
  const tokenId = Number(event.pathParameters?.token_id);
  if (!Number.isInteger(tokenId)) throw new Error("Invalid token_id");
  const { rows } = await poolInstance.query(
    "SELECT * FROM offers WHERE token_id = $1 ORDER BY offer_nanoton DESC",
    [tokenId]
  );
  return jsonResponse(200, { ok: true, offers: rows });
}

async function handleGetMyNfts(event) {
  const poolInstance = getPool();
  const wallet = event.queryStringParameters?.wallet;
  if (!wallet) throw new Error("wallet is required");
  const { rows } = await poolInstance.query(
    "SELECT * FROM nft_items WHERE owner_address = $1 ORDER BY token_id",
    [wallet]
  );
  return jsonResponse(200, { ok: true, items: rows });
}

async function handlePrepareList(event) {
  const poolInstance = getPool();
  const payload = parseJson(event.body);
  requireFields(payload, ["wallet", "token_id", "price_nanoton"]);

  const tokenId = Number(payload.token_id);
  const priceNanoton = BigInt(payload.price_nanoton);
  if (!Number.isInteger(tokenId) || tokenId < 0) throw new Error("Invalid token_id");
  if (priceNanoton <= 0n) throw new Error("price_nanoton must be positive");

  const item = await getNftItemByToken(poolInstance, tokenId);
  const nftAddress = ensureNftAddress(item);

  const { rows } = await poolInstance.query(
    `INSERT INTO listings (token_id, seller_wallet, price_nanoton, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [tokenId, payload.wallet, priceNanoton.toString()]
  );

  const listing = rows[0];
  const comment = `LIST:${listing.id}:${tokenId}:${priceNanoton}`;
  const tx = buildTonConnectTx({
    messages: [
      {
        address: nftAddress,
        amount: "50000000",
        payload: buildTransferComment(comment),
      },
    ],
  });

  return jsonResponse(200, { ok: true, listing, tx });
}

async function handlePrepareBuy(event) {
  const poolInstance = getPool();
  const payload = parseJson(event.body);
  requireFields(payload, ["wallet", "token_id"]);

  const tokenId = Number(payload.token_id);
  if (!Number.isInteger(tokenId)) throw new Error("Invalid token_id");

  const { rows } = await poolInstance.query(
    "SELECT * FROM listings WHERE token_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1",
    [tokenId]
  );
  const listing = rows[0];
  if (!listing) throw new Error("Active listing not found");

  const fee = (BigInt(listing.price_nanoton) * BigInt(MARKET_FEE_BPS)) / 10000n;
  const sellerAmount = BigInt(listing.price_nanoton) - fee;

  const tx = buildTonConnectTx({
    messages: [
      {
        address: listing.seller_wallet,
        amount: sellerAmount.toString(),
        payload: buildTransferComment(`BUY:${listing.id}:${tokenId}`),
      },
      {
        address: MARKET_FEE_ADDRESS,
        amount: fee.toString(),
        payload: buildTransferComment(`FEE:${listing.id}`),
      },
    ],
  });

  return jsonResponse(200, { ok: true, listing, tx });
}

async function handlePrepareOffer(event) {
  const poolInstance = getPool();
  const payload = parseJson(event.body);
  requireFields(payload, ["wallet", "token_id", "offer_nanoton"]);

  const tokenId = Number(payload.token_id);
  const offerNanoton = BigInt(payload.offer_nanoton);
  if (!Number.isInteger(tokenId)) throw new Error("Invalid token_id");
  if (offerNanoton <= 0n) throw new Error("offer_nanoton must be positive");

  const item = await getNftItemByToken(poolInstance, tokenId);
  ensureNftAddress(item);

  const { rows } = await poolInstance.query(
    `INSERT INTO offers (token_id, buyer_wallet, offer_nanoton, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [tokenId, payload.wallet, offerNanoton.toString()]
  );

  const offer = rows[0];
  const tx = buildTonConnectTx({
    messages: [
      {
        address: MARKET_FEE_ADDRESS,
        amount: offerNanoton.toString(),
        payload: buildTransferComment(`OFFER:${offer.id}:${tokenId}`),
      },
    ],
  });

  return jsonResponse(200, { ok: true, offer, tx });
}

async function handlePrepareAcceptOffer(event) {
  const poolInstance = getPool();
  const payload = parseJson(event.body);
  requireFields(payload, ["wallet", "token_id", "offer_id"]);

  const tokenId = Number(payload.token_id);
  const offerId = Number(payload.offer_id);
  if (!Number.isInteger(tokenId) || !Number.isInteger(offerId)) throw new Error("Invalid token_id or offer_id");

  const { rows } = await poolInstance.query(
    "SELECT * FROM offers WHERE id = $1 AND token_id = $2 AND status = 'active'",
    [offerId, tokenId]
  );
  const offer = rows[0];
  if (!offer) throw new Error("Active offer not found");

  const fee = (BigInt(offer.offer_nanoton) * BigInt(MARKET_FEE_BPS)) / 10000n;
  const sellerAmount = BigInt(offer.offer_nanoton) - fee;

  const tx = buildTonConnectTx({
    messages: [
      {
        address: payload.wallet,
        amount: sellerAmount.toString(),
        payload: buildTransferComment(`ACCEPT:${offer.id}:${tokenId}`),
      },
      {
        address: MARKET_FEE_ADDRESS,
        amount: fee.toString(),
        payload: buildTransferComment(`FEE:${offer.id}`),
      },
    ],
  });

  return jsonResponse(200, { ok: true, offer, tx });
}

async function handler(event) {
  try {
    const { httpMethod, path } = event;

    if (httpMethod === "GET" && path === "/market/listings") return await handleGetListings(event);
    if (httpMethod === "GET" && path?.startsWith("/market/offers/")) return await handleGetOffers(event);
    if (httpMethod === "GET" && path === "/me/nfts") return await handleGetMyNfts(event);
    if (httpMethod === "POST" && path === "/tx/prepare-list") return await handlePrepareList(event);
    if (httpMethod === "POST" && path === "/tx/prepare-buy") return await handlePrepareBuy(event);
    if (httpMethod === "POST" && path === "/tx/prepare-offer") return await handlePrepareOffer(event);
    if (httpMethod === "POST" && path === "/tx/prepare-accept-offer") return await handlePrepareAcceptOffer(event);

    return jsonResponse(404, { ok: false, error: "Not found" });
  } catch (err) {
    return jsonResponse(400, { ok: false, error: err.message || "Bad request" });
  }
}

module.exports = { handler };
