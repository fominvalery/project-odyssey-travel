UPDATE t_p32045231_project_odyssey_trav.users
SET grace_period_end_at = subscription_end_at + INTERVAL '3 days'
WHERE (plan = 'club' OR status = 'club')
  AND grace_period_end_at IS NULL
  AND subscription_end_at IS NOT NULL;
