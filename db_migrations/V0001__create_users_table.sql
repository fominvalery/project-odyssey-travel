CREATE TABLE IF NOT EXISTS t_p32045231_project_odyssey_trav.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  company TEXT DEFAULT '',
  plan TEXT DEFAULT 'green',
  status TEXT DEFAULT 'resident',
  avatar_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);