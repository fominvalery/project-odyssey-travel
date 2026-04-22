CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.withdrawal_requests (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES t_p32045231_project_odyssey_trav.users(id),
  entity_type VARCHAR(20) NOT NULL,
  full_name   TEXT NOT NULL,
  inn         VARCHAR(12) NOT NULL,
  bank_name   TEXT,
  bik         VARCHAR(9),
  account     VARCHAR(20) NOT NULL,
  amount      NUMERIC(12,2),
  comment     TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
