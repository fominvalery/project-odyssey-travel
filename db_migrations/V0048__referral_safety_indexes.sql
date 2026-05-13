CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_status ON withdrawal_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_referral_bonuses_referrer ON referral_bonuses(referrer_id);
CREATE UNIQUE INDEX IF NOT EXISTS referral_bonuses_commission_order_unique ON referral_bonuses(referrer_id, order_id, bonus_type) WHERE order_id IS NOT NULL;
