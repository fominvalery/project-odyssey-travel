CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    object_id UUID,
    object_title TEXT DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT DEFAULT '',
    message TEXT DEFAULT '',
    source TEXT DEFAULT 'Маркетплейс',
    stage TEXT DEFAULT 'Лид',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_owner ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_object ON leads(object_id);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
