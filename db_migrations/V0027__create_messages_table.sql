CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.messages (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES t_p32045231_project_odyssey_trav.users(id),
  receiver_id uuid NOT NULL REFERENCES t_p32045231_project_odyssey_trav.users(id),
  text text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON t_p32045231_project_odyssey_trav.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON t_p32045231_project_odyssey_trav.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON t_p32045231_project_odyssey_trav.messages(created_at);