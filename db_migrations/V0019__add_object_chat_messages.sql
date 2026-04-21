CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.object_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'owner')),
  name TEXT,
  phone TEXT,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocm_object_session ON t_p32045231_project_odyssey_trav.object_chat_messages (object_id, session_id, created_at);