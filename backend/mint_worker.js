const { Pool } = require("pg");
const crypto = require("crypto");

const STAGES = ["paid", "queued", "seeded", "rendering", "uploading", "minting", "minted"];

const DEFAULT_QUICK_SECONDS = {
  paid: 2,
  queued: 1,
  seeded: 1,
  rendering: 4,
  uploading: 3,
  minting: 2,
};

const DEFAULT_FORGE_SECONDS = {
  paid: 20,
  queued: 60,
  seeded: 30,
  rendering: 240,
  uploading: 120,
  minting: 60,
};

const TIER_TABLE = {
  quick: [
    { tier: "Common", max: 0.8 },
    { tier: "Rare", max: 0.97 },
    { tier: "Epic", max: 0.998 },
    { tier: "Legendary", max: 1 },
  ],
  forge: [
    { tier: "Common", max: 0.6 },
    { tier: "Rare", max: 0.9 },
    { tier: "Epic", max: 0.99 },
    { tier: "Legendary", max: 1 },
  ],
};

let pool;

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is required");
    pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  }
  return pool;
}

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function sha256Buffer(input) {
  return crypto.createHash("sha256").update(input).digest();
}

function selectTier(finalSeedHex, mode) {
  const hash = crypto.createHash("sha256").update(`${finalSeedHex}:rarity`).digest();
  const r = hash.readUInt32BE(0) / 2 ** 32;
  const table = TIER_TABLE[mode] || TIER_TABLE.quick;
  return table.find((t) => r <= t.max)?.tier || "Common";
}

function getDurations(mode) {
  const env = mode === "forge" ? process.env.MINT_FORGE_STAGE_SECONDS : process.env.MINT_QUICK_STAGE_SECONDS;
  if (env) {
    try {
      const parsed = JSON.parse(env);
      return { ...DEFAULT_QUICK_SECONDS, ...parsed };
    } catch (err) {
      console.warn("Invalid stage seconds JSON, using defaults");
    }
  }
  return mode === "forge" ? DEFAULT_FORGE_SECONDS : DEFAULT_QUICK_SECONDS;
}

function computeOverallProgress(stageIndex, stageProgress) {
  const totalStages = STAGES.length - 1;
  if (stageIndex >= totalStages) return 100;
  const base = (stageIndex / totalStages) * 100;
  const step = (1 / totalStages) * 100;
  return Math.min(100, Math.round(base + (stageProgress / 100) * step));
}

function computeEta(stageIndex, stageProgress, durations) {
  if (stageIndex >= STAGES.length - 1) return 0;
  const currentStage = STAGES[stageIndex];
  const currentDuration = durations[currentStage] || 0;
  const remainingInStage = Math.max(0, currentDuration - (currentDuration * stageProgress) / 100);
  let remaining = remainingInStage;
  for (let i = stageIndex + 1; i < STAGES.length - 1; i += 1) {
    remaining += durations[STAGES[i]] || 0;
  }
  return Math.round(remaining);
}

async function ensureSeedAndTier(poolInstance, row) {
  if (row.seed_hash) return row;
  const oracleSeed = crypto.randomBytes(32);
  const oracleSeedHash = sha256Hex(oracleSeed);
  const finalSeed = sha256Hex(
    Buffer.concat([
      oracleSeed,
      Buffer.from(row.request_id),
      Buffer.from(row.wallet),
      Buffer.from(row.mode),
      Buffer.from(row.style || ""),
    ])
  );

  const seedHash = sha256Hex(Buffer.from(finalSeed));
  const tier = selectTier(finalSeed, row.mode);

  await poolInstance.query(
    `UPDATE mint_requests
     SET oracle_seed_hash = $1,
         seed_hash = $2,
         tier = $3,
         preview_url = COALESCE(preview_url, $4)
     WHERE request_id = $5`,
    [oracleSeedHash, seedHash, tier, buildPreviewUrl(row.request_id), row.request_id]
  );

  return { ...row, oracle_seed_hash: oracleSeedHash, seed_hash: seedHash, tier };
}

function buildAssetBaseUrl() {
  return process.env.MINT_ASSET_BASE_URL || "https://storage.yandexcloud.net/zootopia-mint";
}

function buildPreviewUrl(requestId) {
  return `${buildAssetBaseUrl()}/previews/${requestId}.png`;
}

function buildImageUrl(requestId) {
  return `${buildAssetBaseUrl()}/images/${requestId}.png`;
}

function buildAnimationUrl(requestId) {
  return `${buildAssetBaseUrl()}/animations/${requestId}.webp`;
}

function buildMetadataUrl(requestId) {
  return `${buildAssetBaseUrl()}/metadata/${requestId}.json`;
}

function buildFakeNftAddress(seedHash) {
  const hash = sha256Buffer(seedHash);
  return `EQ${hash.toString("base64url").slice(0, 46)}`;
}

async function advanceRequest(poolInstance, row) {
  const stageIndex = STAGES.indexOf(row.status);
  if (stageIndex < 0 || row.status === "minted") return;

  const durations = getDurations(row.mode);
  const stageDuration = durations[row.status] || 1;
  const elapsedSeconds = Math.max(0, (Date.now() - new Date(row.stage_started_at).getTime()) / 1000);
  const stageProgress = Math.min(100, Math.round((elapsedSeconds / stageDuration) * 100));
  const overallProgress = computeOverallProgress(stageIndex, stageProgress);
  const etaSeconds = computeEta(stageIndex, stageProgress, durations);

  if (stageProgress < 100) {
    await poolInstance.query(
      `UPDATE mint_requests
       SET stage_progress = $1,
           overall_progress = $2,
           eta_seconds = $3,
           updated_at = NOW()
       WHERE request_id = $4`,
      [stageProgress, overallProgress, etaSeconds, row.request_id]
    );
    return;
  }

  const nextStage = STAGES[Math.min(stageIndex + 1, STAGES.length - 1)];
  let nextRow = row;

  if (nextStage === "seeded") {
    nextRow = await ensureSeedAndTier(poolInstance, row);
  }

  if (nextStage === "minted") {
    await poolInstance.query(
      `UPDATE mint_requests
       SET status = $1,
           stage_progress = 100,
           overall_progress = 100,
           eta_seconds = 0,
           image_url = COALESCE(image_url, $2),
           animation_url = CASE WHEN mode = 'forge' THEN COALESCE(animation_url, $3) ELSE animation_url END,
           metadata_url = COALESCE(metadata_url, $4),
           nft_address = COALESCE(nft_address, $5),
           updated_at = NOW()
       WHERE request_id = $6`,
      [
        nextStage,
        buildImageUrl(row.request_id),
        buildAnimationUrl(row.request_id),
        buildMetadataUrl(row.request_id),
        buildFakeNftAddress(row.seed_hash || row.request_id),
        row.request_id,
      ]
    );
    return;
  }

  await poolInstance.query(
    `UPDATE mint_requests
     SET status = $1,
         stage_progress = 0,
         overall_progress = $2,
         eta_seconds = $3,
         stage_started_at = NOW(),
         updated_at = NOW()
     WHERE request_id = $4`,
    [nextStage, computeOverallProgress(stageIndex + 1, 0), computeEta(stageIndex + 1, 0, durations), row.request_id]
  );
}

async function handler() {
  const poolInstance = getPool();
  const { rows } = await poolInstance.query(
    "SELECT * FROM mint_requests WHERE status <> 'minted' ORDER BY created_at ASC LIMIT 50"
  );

  for (const row of rows) {
    await advanceRequest(poolInstance, row);
  }

  return { statusCode: 200, body: "ok" };
}

module.exports = { handler };
