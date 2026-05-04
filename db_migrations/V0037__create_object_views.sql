CREATE TABLE IF NOT EXISTS object_views (
  id BIGSERIAL PRIMARY KEY,
  object_id UUID NOT NULL,
  owner_id UUID,
  viewer_id UUID,
  source TEXT DEFAULT '',
  ip TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_object_views_object_id ON object_views(object_id);
CREATE INDEX IF NOT EXISTS idx_object_views_owner_id ON object_views(owner_id);
CREATE INDEX IF NOT EXISTS idx_object_views_created_at ON object_views(created_at);
CREATE INDEX IF NOT EXISTS idx_object_views_owner_date ON object_views(owner_id, created_at);