ALTER TABLE object_chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE object_chat_messages ADD COLUMN IF NOT EXISTS owner_id UUID NULL;
CREATE INDEX IF NOT EXISTS idx_ocm_owner ON object_chat_messages(owner_id);
CREATE INDEX IF NOT EXISTS idx_ocm_object_session ON object_chat_messages(object_id, session_id);
CREATE INDEX IF NOT EXISTS idx_ocm_unread_owner ON object_chat_messages(owner_id, is_read) WHERE is_read = FALSE;
UPDATE object_chat_messages ocm SET owner_id = o.user_id FROM objects o WHERE ocm.object_id::text = o.id::text AND ocm.owner_id IS NULL;
