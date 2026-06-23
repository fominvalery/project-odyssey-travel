CREATE TABLE IF NOT EXISTS contractor_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_phone TEXT,
  company_email TEXT,
  company_website TEXT,
  reward TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'percent',
  description TEXT,
  region TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  logo_url TEXT,
  photos JSONB DEFAULT '[]',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contractor_fixations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_offer_id UUID,
  broker_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractor_offers_status ON contractor_offers(status);
CREATE INDEX IF NOT EXISTS idx_contractor_offers_type ON contractor_offers(type);
CREATE INDEX IF NOT EXISTS idx_contractor_fixations_offer ON contractor_fixations(contractor_offer_id);
CREATE INDEX IF NOT EXISTS idx_contractor_fixations_broker ON contractor_fixations(broker_id);
