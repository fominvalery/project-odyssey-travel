UPDATE users
SET subscription_end_at = NOW() + INTERVAL '30 days',
    grace_period_end_at = NOW() + INTERVAL '33 days'
WHERE id = 'd424fab5-dce1-4231-bc83-3aca56583026';
