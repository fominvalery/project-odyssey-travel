-- Добавляем поля предпочтений клиента для точного автоподбора объектов
ALTER TABLE leads
    ADD COLUMN IF NOT EXISTS budget_from bigint NULL,
    ADD COLUMN IF NOT EXISTS budget_to bigint NULL,
    ADD COLUMN IF NOT EXISTS area_from numeric NULL,
    ADD COLUMN IF NOT EXISTS area_to numeric NULL,
    ADD COLUMN IF NOT EXISTS preferred_type text NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS preferred_city text NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS preferred_category text NULL DEFAULT '';