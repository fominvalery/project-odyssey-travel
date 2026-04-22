CREATE TABLE t_p32045231_project_odyssey_trav.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(32) NOT NULL DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON t_p32045231_project_odyssey_trav.notifications(user_id);
CREATE INDEX idx_notifications_created_at ON t_p32045231_project_odyssey_trav.notifications(created_at DESC);
