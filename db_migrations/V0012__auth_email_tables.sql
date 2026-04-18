
ALTER TABLE t_p32045231_project_odyssey_trav.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_email ON t_p32045231_project_odyssey_trav.users(email);

CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES t_p32045231_project_odyssey_trav.users(id),
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON t_p32045231_project_odyssey_trav.refresh_tokens(token_hash);

CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES t_p32045231_project_odyssey_trav.users(id),
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON t_p32045231_project_odyssey_trav.password_reset_tokens(token_hash);

CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES t_p32045231_project_odyssey_trav.users(id),
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_hash ON t_p32045231_project_odyssey_trav.email_verification_tokens(token_hash);
