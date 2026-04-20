ALTER TABLE t_p32045231_project_odyssey_trav.orders
  ADD COLUMN IF NOT EXISTS user_id uuid NULL,
  ADD COLUMN IF NOT EXISTS order_type varchar(50) NULL DEFAULT 'listings';
