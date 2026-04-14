CREATE TABLE t_p32045231_project_odyssey_trav.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  category text NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  city text DEFAULT '',
  address text DEFAULT '',
  price text DEFAULT '',
  area text DEFAULT '',
  description text DEFAULT '',
  yield_percent text DEFAULT '',
  extra_fields jsonb DEFAULT '{}',
  status text DEFAULT 'Активен',
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
