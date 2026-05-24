CREATE TABLE IF NOT EXISTS dialog_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📁',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dialog_folder_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES dialog_folders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  partner_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(folder_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_dialog_folders_user ON dialog_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_dialog_folder_items_folder ON dialog_folder_items(folder_id);
CREATE INDEX IF NOT EXISTS idx_dialog_folder_items_user ON dialog_folder_items(user_id);
