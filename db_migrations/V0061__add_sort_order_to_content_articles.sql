ALTER TABLE t_p32045231_project_odyssey_trav.content_articles ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

UPDATE t_p32045231_project_odyssey_trav.content_articles SET sort_order = 0 WHERE sort_order = 0;