-- Индексы которых не хватает

-- objects: поиск по user_id (владелец объектов) — нет индекса
CREATE INDEX idx_objects_user_id ON t_p32045231_project_odyssey_trav.objects (user_id);

-- objects: маркетплейс — фильтр по статусу активно используется
CREATE INDEX idx_objects_status ON t_p32045231_project_odyssey_trav.objects (status);

-- joint_deals: поиск сделок по участникам
CREATE INDEX idx_joint_deals_initiator ON t_p32045231_project_odyssey_trav.joint_deals (initiator_id);
CREATE INDEX idx_joint_deals_partner ON t_p32045231_project_odyssey_trav.joint_deals (partner_id);

-- joint_deal_proposals: поиск предложений по сделке
CREATE INDEX idx_joint_proposals_deal ON t_p32045231_project_odyssey_trav.joint_deal_proposals (deal_id);

-- orders: поиск заказов по пользователю
CREATE INDEX idx_orders_user_id ON t_p32045231_project_odyssey_trav.orders (user_id);

-- referrals: поиск по реферреру
CREATE INDEX idx_referrals_referrer_id ON t_p32045231_project_odyssey_trav.referrals (referrer_id);
