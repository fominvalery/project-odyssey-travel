-- Расширяем organizations: клубные поля + АН-специфичные
ALTER TABLE t_p32045231_project_odyssey_trav.organizations
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS website text DEFAULT '',
  ADD COLUMN IF NOT EXISTS telegram_username text DEFAULT '',
  ADD COLUMN IF NOT EXISTS vk_username text DEFAULT '',
  ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS experience text DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS license_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS founded_year int NULL,
  ADD COLUMN IF NOT EXISTS agents_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deals_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating numeric(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Таблица сделок агентства
CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.agency_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES t_p32045231_project_odyssey_trav.organizations(id),
  agent_id uuid NOT NULL REFERENCES t_p32045231_project_odyssey_trav.users(id),
  object_id uuid NULL,
  title text NOT NULL,
  deal_type text NOT NULL DEFAULT 'sale',
  amount numeric(15,2) NULL,
  commission_total numeric(15,2) NULL,
  commission_agent_pct numeric(5,2) DEFAULT 50,
  commission_agency_pct numeric(5,2) DEFAULT 50,
  commission_agent numeric(15,2) NULL,
  commission_agency numeric(15,2) NULL,
  status text NOT NULL DEFAULT 'active',
  client_name text DEFAULT '',
  client_phone text DEFAULT '',
  notes text DEFAULT '',
  closed_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Отзывы об агентстве
CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.agency_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES t_p32045231_project_odyssey_trav.organizations(id),
  author_id uuid NULL,
  author_name text NOT NULL DEFAULT '',
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text text DEFAULT '',
  deal_type text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_agency_deals_org ON t_p32045231_project_odyssey_trav.agency_deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_deals_agent ON t_p32045231_project_odyssey_trav.agency_deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_agency_reviews_org ON t_p32045231_project_odyssey_trav.agency_reviews(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON t_p32045231_project_odyssey_trav.org_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON t_p32045231_project_odyssey_trav.org_memberships(organization_id);
