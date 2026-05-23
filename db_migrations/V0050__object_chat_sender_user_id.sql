ALTER TABLE object_chat_messages ADD COLUMN IF NOT EXISTS sender_user_id UUID NULL REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_ocm_sender_user ON object_chat_messages(sender_user_id) WHERE sender_user_id IS NOT NULL;
