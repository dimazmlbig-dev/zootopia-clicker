-- 001_market.sql
-- NFT marketplace tables

CREATE TABLE IF NOT EXISTS nft_items (
  token_id INTEGER PRIMARY KEY,
  nft_address TEXT UNIQUE,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  rarity TEXT NOT NULL,
  owner_address TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
  id BIGSERIAL PRIMARY KEY,
  token_id INTEGER NOT NULL REFERENCES nft_items(token_id) ON DELETE CASCADE,
  seller_wallet TEXT NOT NULL,
  price_nanoton BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'sold', 'cancelled')),
  sale_contract_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tx_hash TEXT
);

CREATE INDEX IF NOT EXISTS listings_status_idx ON listings(status);
CREATE INDEX IF NOT EXISTS listings_token_idx ON listings(token_id);

CREATE TABLE IF NOT EXISTS offers (
  id BIGSERIAL PRIMARY KEY,
  token_id INTEGER NOT NULL REFERENCES nft_items(token_id) ON DELETE CASCADE,
  buyer_wallet TEXT NOT NULL,
  offer_nanoton BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'accepted', 'cancelled', 'expired')),
  offer_contract_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tx_hash TEXT
);

CREATE INDEX IF NOT EXISTS offers_token_idx ON offers(token_id);
CREATE INDEX IF NOT EXISTS offers_status_idx ON offers(status);

CREATE TABLE IF NOT EXISTS reward_epochs (
  id BIGSERIAL PRIMARY KEY,
  epoch_date DATE NOT NULL UNIQUE,
  fee_total_nanoton BIGINT NOT NULL DEFAULT 0,
  rewards_nanoton BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
