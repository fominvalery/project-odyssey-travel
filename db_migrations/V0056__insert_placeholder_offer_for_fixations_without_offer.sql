INSERT INTO agg_offers (id, title, category, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'Объект не указан', 'residential', 'draft')
ON CONFLICT (id) DO NOTHING;