-- Обновление users: переименование green→basic, resident→basic, добавление счётчиков объявлений
ALTER TABLE t_p32045231_project_odyssey_trav.users
  ALTER COLUMN plan SET DEFAULT 'basic',
  ALTER COLUMN status SET DEFAULT 'basic';

UPDATE t_p32045231_project_odyssey_trav.users SET plan = 'basic' WHERE plan = 'green' OR plan IS NULL;
UPDATE t_p32045231_project_odyssey_trav.users SET status = 'basic' WHERE status = 'resident' OR status IS NULL;

ALTER TABLE t_p32045231_project_odyssey_trav.users
  ADD COLUMN IF NOT EXISTS listings_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS listings_extra integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS listings_period_start timestamp with time zone NOT NULL DEFAULT now();
