# Backend — Кабинет-24

## Архитектура

Все функции — Python 3.11, Cloud Functions. Вызываются по HTTP через URL из `func2url.json`.
БД: PostgreSQL, схема `t_p32045231_project_odyssey_trav` (из env `MAIN_DB_SCHEMA`).
Только Simple Query Protocol — psycopg2, никаких параметризованных запросов с `%s` в строке напрямую кроме как через `cur.execute(sql, tuple(args))`.

---

## Функции

| Функция | Назначение | Критично |
|---|---|---|
| `subscription-checker` | Сброс тарифов, уведомления об истечении | SMTP батчи по 10, пауза 1 сек |
| `admin` | Супер-админ: пользователи, рассылки | Два способа авторизации |
| `agg-admin` | CRUD предложений База/Проекты | PUT: args → tuple() |
| `agency` | Агентства, роли, приглашения | Иерархия ролей фиксирована |
| `objects` | CRUD объектов брокера | |
| `agg-offers` | Публичный каталог агрегатора | |
| `agg-fixations` | Фиксации клиентов | ADMIN_TOKEN из env |
| `login` / `register` | Авторизация | JWT_SECRET из env |
| `upload-photo` | Загрузка фото в S3 | base64 в теле запроса |
| `object-pdf` | Генерация PDF презентации | |
| `generate-presentation` | ИИ-генерация презентации | |
| `describe-object` | ИИ-описание объекта | OpenRouter API |
| `ai-assistant` | ИИ-помощник в чате | model: openrouter/free |
| `analytics` | Трекинг просмотров, метрики | периоды: 7/30/90 дней |
| `leads` / `lead-extras` | Лиды и доп. данные | |
| `joint-deals` | Совместные сделки | |
| `notifications` | Уведомления пользователей | |
| `object-chat` | Чат по объекту | |
| `office-team` | Команда офиса | |
| `agency` | Агентства | |
| `yookassa-*` | Оплата ЮКасса + вебхук | YOOKASSA_* из env |
| `dadata-geocode` / `geocode-fill` | Геокодирование адресов | DADATA_* из env |
| `agg-feed-import` | Импорт XML-фидов (YRL/Циан/Авито) | max 20 фото |
| `content-articles` | Блог, обучение, FAQ | только суперадмин редактирует |
| `grant-welcome-plan` | Выдача 72ч пробного периода | |
| `sitemap` | Генерация sitemap.xml | |
| `og-preview` | OG-изображения для шеринга | |
| `tile-proxy` | Прокси для тайлов карты | |

---

## Критические правила — НЕ НАРУШАТЬ

### 1. SMTP батчи
Везде где отправляются массовые письма (subscription-checker, admin):
- **batch_size = 10** писем за одно SMTP-соединение
- **пауза 1 сек** между батчами
- Gmail блокирует при нарушении этих лимитов

### 2. subscription-checker — порядок операций
1. Сначала все UPDATE в БД + `conn.commit()`
2. Потом `send_emails_bulk(email_queue)`
Если перепутать — при таймауте SMTP тарифы не сбросятся.

### 3. agg-admin PUT
`cur.execute(sql, tuple(args))` — обязательно `tuple()`.
psycopg2 Simple Query Protocol не принимает list, выбрасывает IndexError.

### 4. Grace period (subscription-checker)
- `subscription_end_at` — дата окончания подписки
- `grace_period_end_at` — дата окончания льготного периода (+3 дня)
- Сброс на Basic только после grace, НЕ после subscription_end_at

### 5. 72-часовой пробный период
Определяется по: `SELECT COUNT(*) FROM orders WHERE user_id=? AND status='paid'`
Если 0 оплаченных заказов — это пробный период, уходит другое письмо.

### 6. Авторизация admin-функции
Два равнозначных способа:
- `X-Admin-Token: <ADMIN_SECRET>`
- `X-User-Id: <id>` где пользователь имеет `is_superadmin=true`

---

## Секреты (env variables)

| Секрет | Где используется |
|---|---|
| `DATABASE_URL` | Все функции с БД |
| `MAIN_DB_SCHEMA` | Все функции с БД |
| `ADMIN_SECRET` | admin, agg-fixations |
| `JWT_SECRET` | login, register, все с авторизацией |
| `SMTP_USER` | subscription-checker, admin, agency |
| `SMTP_PASSWORD` | subscription-checker, admin, agency |
| `AWS_ACCESS_KEY_ID` | upload-photo, object-pdf, S3 |
| `AWS_SECRET_ACCESS_KEY` | upload-photo, object-pdf, S3 |
| `DADATA_API_KEY` | dadata-geocode |
| `DADATA_SECRET_KEY` | dadata-geocode |
| `OPENROUTER_API_KEY` | ai-assistant, describe-object |
| `YOOKASSA_SHOP_ID` | yookassa-yookassa |
| `YOOKASSA_SECRET_KEY` | yookassa-yookassa |
