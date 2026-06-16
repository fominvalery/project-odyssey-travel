UPDATE t_p32045231_project_odyssey_trav.users
SET plan = 'club',
    status = 'broker',
    subscription_end_at = '2026-12-15 00:00:00',
    grace_period_end_at = '2026-12-18 00:00:00',
    updated_at = NOW()
WHERE is_superadmin = FALSE;
