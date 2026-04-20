ALTER TABLE t_p32045231_project_odyssey_trav.users
  ADD COLUMN IF NOT EXISTS is_superadmin boolean NOT NULL DEFAULT false;