ALTER TABLE t_p32045231_project_odyssey_trav.users
  ADD COLUMN IF NOT EXISTS first_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS last_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS middle_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS specializations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio text DEFAULT '',
  ADD COLUMN IF NOT EXISTS experience text DEFAULT '',
  ADD COLUMN IF NOT EXISTS telegram_username text DEFAULT '',
  ADD COLUMN IF NOT EXISTS vk_username text DEFAULT '',
  ADD COLUMN IF NOT EXISTS max_username text DEFAULT '',
  ADD COLUMN IF NOT EXISTS website text DEFAULT '';