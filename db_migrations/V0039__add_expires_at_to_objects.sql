-- Срок жизни объявления (NULL = бессрочно для broker/agency)
ALTER TABLE objects ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
-- Флаг "требует оплаты" — для понижения с Клуба на Базовый: объявления сверх 3 свежих
ALTER TABLE objects ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN NOT NULL DEFAULT FALSE;
-- Флаг автоматического снятия с публикации после истечения
ALTER TABLE objects ADD COLUMN IF NOT EXISTS auto_unpublished BOOLEAN NOT NULL DEFAULT FALSE;
-- Дата последнего уведомления "истекает через N дней", чтобы не спамить
ALTER TABLE objects ADD COLUMN IF NOT EXISTS expiry_notified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_objects_expires_at ON objects(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_objects_requires_payment ON objects(user_id) WHERE requires_payment = TRUE;