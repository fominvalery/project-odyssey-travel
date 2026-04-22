-- Добавляем поле order_id для связи с заказом и убираем старый UNIQUE
-- чтобы комиссии могли начисляться при каждой оплате
ALTER TABLE t_p32045231_project_odyssey_trav.referral_bonuses
  ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES t_p32045231_project_odyssey_trav.orders(id);

-- Удаляем старый UNIQUE constraint (он мешает накоплению комиссий)
ALTER TABLE t_p32045231_project_odyssey_trav.referral_bonuses
  DROP CONSTRAINT IF EXISTS referral_bonuses_referrer_id_referred_id_bonus_type_key;

-- Создаём новый UNIQUE только для first_object (частичный индекс)
CREATE UNIQUE INDEX IF NOT EXISTS referral_bonuses_first_object_unique
  ON t_p32045231_project_odyssey_trav.referral_bonuses (referrer_id, referred_id)
  WHERE bonus_type = 'first_object';
