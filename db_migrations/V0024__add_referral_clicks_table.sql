CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.referral_clicks (
  id          SERIAL PRIMARY KEY,
  ref_code    VARCHAR(8) NOT NULL,
  ip          VARCHAR(64),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_clicks_ref_code_idx
  ON t_p32045231_project_odyssey_trav.referral_clicks (ref_code);

CREATE INDEX IF NOT EXISTS referral_clicks_created_at_idx
  ON t_p32045231_project_odyssey_trav.referral_clicks (created_at);
