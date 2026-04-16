-- Подобранные объекты для лида: хранит какие объекты были предложены клиенту
-- и какие добавлены в "предложения" (lead_files уже есть, это список карточек объектов)
CREATE TABLE IF NOT EXISTS lead_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL,
    owner_id uuid NOT NULL,
    object_id uuid NOT NULL,
    added_to_proposals boolean NOT NULL DEFAULT false,
    seen boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_matches_unique ON lead_matches(lead_id, object_id);
CREATE INDEX IF NOT EXISTS idx_lead_matches_lead ON lead_matches(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_matches_owner ON lead_matches(owner_id);
CREATE INDEX IF NOT EXISTS idx_lead_matches_object ON lead_matches(object_id);