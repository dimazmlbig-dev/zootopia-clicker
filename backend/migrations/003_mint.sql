CREATE TABLE IF NOT EXISTS mint_requests (
  request_id text PRIMARY KEY,
  tg_user_id bigint NULL,
  wallet text NOT NULL,
  mode text NOT NULL,
  style text NULL,
  paid_nanoton numeric(30, 0) NOT NULL,
  status text NOT NULL,
  overall_progress int NOT NULL DEFAULT 0,
  stage_progress int NOT NULL DEFAULT 0,
  eta_seconds int NULL,
  tier text NULL,
  seed_hash text NULL,
  oracle_seed_hash text NULL,
  image_url text NULL,
  animation_url text NULL,
  preview_url text NULL,
  metadata_url text NULL,
  nft_address text NULL,
  stage_started_at timestamptz NOT NULL DEFAULT NOW(),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mint_requests_wallet_idx ON mint_requests (wallet);
CREATE INDEX IF NOT EXISTS mint_requests_status_idx ON mint_requests (status);
