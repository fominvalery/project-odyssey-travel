CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.referral_bonuses (
  id            SERIAL PRIMARY KEY,
  referrer_id   UUID NOT NULL REFERENCES t_p32045231_project_odyssey_trav.users(id),
  referred_id   UUID NOT NULL REFERENCES t_p32045231_project_odyssey_trav.users(id),
  bonus_type    VARCHAR(50) NOT NULL DEFAULT 'first_object',
  amount        NUMERIC(10,2) NOT NULL DEFAULT 20,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id, bonus_type)
);
