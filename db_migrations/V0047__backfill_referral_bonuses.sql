-- Backfill referral bonuses retroactively for all users
-- 1. first_object bonus (20₽) — for every referred user with at least 1 object
INSERT INTO referral_bonuses (referrer_id, referred_id, bonus_type, amount, description)
SELECT r.referrer_id, r.referred_id, 'first_object', 20, 'Реферал создал первый объект (начислено задним числом)'
FROM referrals r
WHERE EXISTS (SELECT 1 FROM objects o WHERE o.user_id = r.referred_id)
ON CONFLICT DO NOTHING;

-- 2. email_verified bonus (10₽) — for every referred user with verified email
INSERT INTO referral_bonuses (referrer_id, referred_id, bonus_type, amount, description)
SELECT r.referrer_id, r.referred_id, 'email_verified', 10, 'Реферал подтвердил email (начислено задним числом)'
FROM referrals r
JOIN users u ON u.id = r.referred_id
WHERE u.email_verified = true
ON CONFLICT DO NOTHING;
