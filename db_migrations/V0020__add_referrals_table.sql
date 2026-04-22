-- Таблица реферальных связей
CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.referrals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES t_p32045231_project_odyssey_trav.users(id),
  referred_id UUID NOT NULL REFERENCES t_p32045231_project_odyssey_trav.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Колонка referral_level в users для ручного override
ALTER TABLE t_p32045231_project_odyssey_trav.users
  ADD COLUMN IF NOT EXISTS referral_level TEXT DEFAULT NULL;
