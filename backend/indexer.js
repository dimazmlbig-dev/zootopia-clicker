const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const TONCENTER_BASE = "https://toncenter.com/api/v3";
const MARKET_FEE_ADDRESS = "UQCJRRRYnrs_qsA2AgIE71dPsHf_-AKaZV9UMeT4vBbh6Yes";

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required");
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

function loadCollection() {
  const filePath = path.join(__dirname, "..", "data", "nft_items.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

async function toncenterFetch(endpoint, params = {}) {
  const apiKey = process.env.TONCENTER_API_KEY;
  if (!apiKey) throw new Error("TONCENTER_API_KEY is required");

  const url = new URL(`${TONCENTER_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });

  const res = await fetch(url, {
    headers: { "X-API-Key": apiKey },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Toncenter error: ${res.status} ${text}`);
  }

  return res.json();
}

async function syncCollectionMetadata() {
  const poolInstance = getPool();
  const items = loadCollection();

  for (const item of items) {
    await poolInstance.query(
      `INSERT INTO nft_items (token_id, nft_address, name, image, rarity)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (token_id)
       DO UPDATE SET nft_address = EXCLUDED.nft_address,
                     name = EXCLUDED.name,
                     image = EXCLUDED.image,
                     rarity = EXCLUDED.rarity,
                     updated_at = NOW()`,
      [item.token_id, item.nft_address, item.name, item.image, item.rarity]
    );
  }
}

async function syncOwners() {
  const poolInstance = getPool();
  const { rows } = await poolInstance.query("SELECT token_id, nft_address FROM nft_items ORDER BY token_id");

  for (const row of rows) {
    if (!row.nft_address) continue;

    const data = await toncenterFetch("/nft/items", { address: row.nft_address });
    const item = data?.nft_items?.[0];
    const owner = item?.owner?.address || null;

    await poolInstance.query(
      "UPDATE nft_items SET owner_address = $1, updated_at = NOW() WHERE token_id = $2",
      [owner, row.token_id]
    );
  }
}

async function syncListings() {
  const poolInstance = getPool();
  const { rows } = await poolInstance.query(
    "SELECT id, sale_contract_address, status FROM listings WHERE status IN ('pending', 'active') AND sale_contract_address IS NOT NULL"
  );

  for (const listing of rows) {
    const txs = await toncenterFetch("/transactions", {
      address: listing.sale_contract_address,
      limit: 5,
    });

    const hasSold = (txs?.transactions || []).some((tx) =>
      tx?.out_msgs?.some((msg) => msg?.destination?.address === MARKET_FEE_ADDRESS)
    );

    if (hasSold) {
      await poolInstance.query(
        "UPDATE listings SET status = 'sold', updated_at = NOW() WHERE id = $1",
        [listing.id]
      );
      continue;
    }

    if (listing.status === "pending") {
      await poolInstance.query(
        "UPDATE listings SET status = 'active', updated_at = NOW() WHERE id = $1",
        [listing.id]
      );
    }
  }
}

async function syncOffers() {
  const poolInstance = getPool();
  const { rows } = await poolInstance.query(
    "SELECT id, offer_contract_address, status FROM offers WHERE status IN ('pending', 'active') AND offer_contract_address IS NOT NULL"
  );

  for (const offer of rows) {
    const txs = await toncenterFetch("/transactions", {
      address: offer.offer_contract_address,
      limit: 5,
    });

    const accepted = (txs?.transactions || []).some((tx) =>
      tx?.out_msgs?.some((msg) => msg?.destination?.address === MARKET_FEE_ADDRESS)
    );

    if (accepted) {
      await poolInstance.query(
        "UPDATE offers SET status = 'accepted', updated_at = NOW() WHERE id = $1",
        [offer.id]
      );
      continue;
    }

    if (offer.status === "pending") {
      await poolInstance.query(
        "UPDATE offers SET status = 'active', updated_at = NOW() WHERE id = $1",
        [offer.id]
      );
    }
  }
}

async function handler() {
  await syncCollectionMetadata();
  await syncOwners();
  await syncListings();
  await syncOffers();

  return { statusCode: 200, body: "ok" };
}

module.exports = { handler };
