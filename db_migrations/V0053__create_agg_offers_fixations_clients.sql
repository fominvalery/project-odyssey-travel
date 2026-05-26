
CREATE TABLE IF NOT EXISTS agg_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subtype TEXT,
  city TEXT,
  region TEXT,
  address TEXT,
  price BIGINT,
  price_label TEXT,
  area NUMERIC,
  yield_percent NUMERIC,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  photos JSONB DEFAULT '[]',
  videos JSONB DEFAULT '[]',
  presentation_url TEXT,
  extra_fields JSONB DEFAULT '{}',
  commission TEXT,
  commission_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agg_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agg_fixations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES agg_offers(id),
  client_id UUID NOT NULL REFERENCES agg_clients(id),
  user_id TEXT NOT NULL,
  agency_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ,
  notes TEXT,
  documents JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agg_offers_category ON agg_offers(category);
CREATE INDEX IF NOT EXISTS idx_agg_offers_status ON agg_offers(status);
CREATE INDEX IF NOT EXISTS idx_agg_fixations_user_id ON agg_fixations(user_id);
CREATE INDEX IF NOT EXISTS idx_agg_fixations_offer_id ON agg_fixations(offer_id);
CREATE INDEX IF NOT EXISTS idx_agg_clients_user_id ON agg_clients(user_id);
