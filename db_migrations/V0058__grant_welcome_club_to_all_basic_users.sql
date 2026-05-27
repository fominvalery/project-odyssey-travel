-- Выдаём приветственный тариф «Клуб» на 72 часа всем верифицированным basic-пользователям
UPDATE t_p32045231_project_odyssey_trav.users
SET
    plan = 'club',
    status = 'broker',
    subscription_end_at = NOW() + INTERVAL '72 hours',
    grace_period_end_at = NOW() + INTERVAL '72 hours' + INTERVAL '3 days',
    updated_at = NOW()
WHERE
    is_superadmin = FALSE
    AND email_verified = TRUE
    AND (status = 'basic' OR status IS NULL OR plan = 'basic' OR plan IS NULL OR plan = 'green');

-- Создаём уведомления для каждого из них (если уведомления ещё не было за последние 3 дня)
INSERT INTO t_p32045231_project_odyssey_trav.notifications (user_id, type, title, body)
SELECT
    id,
    'info',
    'Приветственный доступ к тарифу «Клуб» — 72 часа',
    'Здравствуйте! Рады видеть вас в Кабинете-24 — платформе, где брокеры коммерческой недвижимости находят партнёров, объекты и реальные сделки. Мы открыли вам приветственный доступ к тарифу «Клуб» на 72 часа. Изучите все возможности платформы!'
FROM t_p32045231_project_odyssey_trav.users
WHERE
    is_superadmin = FALSE
    AND email_verified = TRUE
    AND status = 'broker'
    AND subscription_end_at > NOW()
    AND NOT EXISTS (
        SELECT 1 FROM t_p32045231_project_odyssey_trav.notifications n
        WHERE n.user_id = users.id
          AND n.title = 'Приветственный доступ к тарифу «Клуб» — 72 часа'
          AND n.created_at > NOW() - INTERVAL '3 days'
    );