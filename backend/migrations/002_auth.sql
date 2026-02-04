CREATE TABLE users (
  id bigserial PRIMARY KEY,
  tg_user_id bigint UNIQUE NOT NULL,
  username text,
  first_name text,
  created_at timestamptz DEFAULT now(),
  last_login_at timestamptz
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  user_agent text,
  ip text
);

CREATE TABLE wallet_links (
  id bigserial PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address text UNIQUE NOT NULL,
  is_primary boolean DEFAULT true,
  linked_at timestamptz DEFAULT now()
);

CREATE TABLE player_state (
  user_id bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  state_json jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_users_tg_user_id ON users (tg_user_id);
CREATE INDEX idx_wallet_links_user_id ON wallet_links (user_id);
CREATE INDEX idx_wallet_links_wallet_address ON wallet_links (wallet_address);
CREATE INDEX idx_player_state_updated_at ON player_state (updated_at);
