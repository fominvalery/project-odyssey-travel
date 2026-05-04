# Срок размещения объявлений

Документ описывает логику автоматического срока жизни объявлений недвижимости и переходов между тарифами.

## Бизнес-логика

### Тариф «Базовый»
- Срок жизни объявления — **30 дней** с момента публикации.
- В отчётном периоде (30 дней) пользователю даётся **3 бесплатных слота**.
- Каждый новый отчётный период счётчик сбрасывается.
- Платные слоты — пакеты «Объявления» по 199 ₽ за штуку (со скидками 10–30% от объёма).
- Продление = 1 слот: бесплатный, если есть, иначе платный.
- По истечении 30 дней без продления — объект **снимается с публикации** (`auto_unpublished = TRUE`, `published = FALSE`), не удаляется.
- Снятые объекты доступны во вкладке «Истекли» и могут быть восстановлены продлением.
- Уведомление **за 3 дня** до истечения (email + колокольчик).

### Тариф «Клуб» (broker)
- Размещение объявлений **безлимитно по сроку и количеству**.
- `expires_at = NULL`.
- Подписка имеет свой срок (`subscription_end_at`) с льготным периодом (`grace_period_end_at`) +3 дня.

### Тариф «Агентство»
- Идентично «Клубу» — безлимит. Активным членам организации (`org_memberships.status = 'active'`) всегда выдаётся безлимит независимо от `users.status`.

### Понижение Клуб → Базовый
Когда `grace_period_end_at < NOW()` для broker:
1. `users.status = 'basic'`, `plan = 'basic'`.
2. **Если пользователь — активный член АН** — объекты НЕ урезаются (он продолжает работать в агентстве).
3. **Иначе** — все опубликованные активные объекты пользователя:
   - **Топ-3 самых свежих** (по `created_at DESC`) → `expires_at = NOW() + 30 дней` (занимают бесплатные слоты Базового).
   - **Остальные** → `expires_at = NOW() + 3 дня`, `requires_payment = TRUE`.
4. Уведомление о деактивации подписки.
5. У пользователя есть 3 дня, чтобы:
   - продлить Клуб (все сроки сбрасываются обратно в `NULL`),
   - купить пакет объявлений (объекты с `requires_payment` продлеваются на 30 дней автоматически в порядке `created_at DESC`).

## Схема БД

Миграция `V0039__add_expires_at_to_objects.sql`:

```sql
ALTER TABLE objects ADD COLUMN expires_at TIMESTAMPTZ;
ALTER TABLE objects ADD COLUMN requires_payment BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE objects ADD COLUMN auto_unpublished BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE objects ADD COLUMN expiry_notified_at TIMESTAMPTZ;

CREATE INDEX idx_objects_expires_at ON objects(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_objects_requires_payment ON objects(user_id) WHERE requires_payment = TRUE;
```

| Поле | Назначение |
|---|---|
| `expires_at` | Дата автоснятия с публикации. `NULL` = бессрочно. |
| `requires_payment` | Флаг «требует оплаты после понижения тарифа». |
| `auto_unpublished` | Флаг «автоматически снят с публикации». |
| `expiry_notified_at` | Когда последний раз слали уведомление (антиспам). |

## Backend

### `backend/objects/index.py`
- `get_user_status(cur, schema, user_id)` — возвращает эффективный статус. Активный член АН → `'agency'`, иначе `users.status`.
- `calc_expires_for_user(status)` — `NULL` для broker/agency, `NOW() + 30 дней` для остальных.
- **POST с `action="extend"`** — продление:
  - broker/agency → `expires_at = NULL`, снять флаги, восстановить `published`.
  - basic с свободным слотом → продление с `expires_at` (или с `NOW()` если истёк), потратить слот.
  - basic без слотов → `HTTP 402 {"error": "no_free_slots"}`.
- **GET маркетплейса** — фильтрует `auto_unpublished = FALSE AND (expires_at IS NULL OR expires_at > NOW())`.
- **POST создание** — автоматически проставляет `expires_at` по тарифу.

### `backend/subscription-checker/index.py` (cron)
1. Уведомления о подписке Клуба за 4/2/1 день и при истечении.
2. **При `now > grace_period_end_at` для broker**:
   - Сброс на basic.
   - Если не в АН — проставление сроков объектов (топ-3 = 30 дней, остальные = 3 дня + `requires_payment`).
3. **Уведомление за 3 дня до истечения объявления** — email + колокольчик. Антиспам через `expiry_notified_at`.
4. **Автоснятие истёкших** — `expires_at < NOW()` → `auto_unpublished = TRUE, published = FALSE`. Уведомление владельцу.

### `backend/extensions/yookassa/yookassa-webhook/index.py`
- **`order_type = 'listings'`**:
  1. Сначала автоматически продлевает объекты с `requires_payment = TRUE` в порядке `created_at DESC`, тратя купленные слоты.
  2. Остаток слотов идёт в `users.listings_extra`.
- **`order_type = 'subscription'`**:
  1. Активирует Клуб (`status = 'broker'`, `subscription_end_at`, `grace_period_end_at`).
  2. **Сбрасывает `expires_at = NULL`**, `requires_payment = FALSE`, `auto_unpublished = FALSE` у всех объектов владельца.
  3. Восстанавливает `published = TRUE` для активных.

## Frontend

### `src/components/dashboard/ObjectCard.tsx`
- Плашка «Истекает через N дней» (жёлтая, при ≤7 дней).
- Плашка «Требует оплаты · N дн.» (оранжевая, при `requires_payment`).
- Плашка «Истекло — снято с публикации» (красная, при `auto_unpublished`).
- Ссылка «Продлить» — вызывает `onExtend(id)`.

### `src/components/dashboard/DashboardObjects.tsx`
- `handleExtend(id)` — POST `objects/extend`. На 402 показывает alert и скроллит к `#listings-banner-pay`.
- Разделение объектов: `activeObjects` (без архива и истёкших), `archivedObjects` (Продан/Сдан), `expiredObjects` (`auto_unpublished`), `requiresPaymentObjects`.
- **Баннер «N объявлений требуют оплаты»** — оранжевый, при `requiresPaymentObjects.length > 0`.
- **Баннер-кнопка «N истекли — продлите»** — красный, открывает вкладку «Истекли».
- **Вкладка «Истекли»** (`showExpired`) — отдельный экран со списком истёкших, кнопками «Продлить» и «Удалить».

### `src/components/wizard/wizardTypes.ts`
В `ObjectData` добавлены поля: `expires_at`, `requires_payment`, `auto_unpublished`, `created_at`.

## Тестовые сценарии

### 1. Создание объявления Базовым пользователем
- Ожидание: `expires_at = NOW() + 30 days`, `requires_payment = FALSE`, `auto_unpublished = FALSE`.

### 2. Создание объявления брокером Клуба
- Ожидание: `expires_at = NULL`.

### 3. Создание объявления членом АН (с `users.status = 'basic'`)
- Через `get_user_status` определяется как `'agency'` → `expires_at = NULL`.

### 4. Продление объявления Базовым (есть бесплатный слот)
- POST `{action: "extend", id, user_id}` → 200, `expires_at` += 30 дней, `listings_used` +1.

### 5. Продление Базовым (нет слотов)
- POST `{action: "extend", id, user_id}` → 402 `{"error": "no_free_slots"}`.

### 6. Продление брокером
- POST `{action: "extend", id, user_id}` → 200, `expires_at = NULL`, флаги сброшены.

### 7. Понижение Клуб → Базовый (cron)
- Пользователь с 5 объектами и истёкшим grace.
- Ожидание: 3 свежих → `expires_at = NOW() + 30d`, 2 старых → `expires_at = NOW() + 3d, requires_payment = TRUE`.

### 8. Понижение Клуб → Базовый, но член АН
- Объекты НЕ изменяются (in_org = true).

### 9. Покупка пакета listings при наличии `requires_payment`
- Куплено 5 слотов, есть 8 объектов с `requires_payment`.
- Ожидание: 5 свежих продлены на 30 дней (`requires_payment = FALSE`), 3 остаются с флагом, `listings_extra` не растёт.

### 10. Оплата подписки Клуба после понижения
- Все объекты владельца → `expires_at = NULL`, флаги сброшены, `published = TRUE` для статуса «Активен».

### 11. Cron: уведомление за 3 дня
- `expires_at` между `NOW()` и `NOW() + 3 days`, `expiry_notified_at IS NULL` → отправляется email + создаётся notification, `expiry_notified_at = NOW()`.

### 12. Cron: автоснятие
- `expires_at < NOW()`, `auto_unpublished = FALSE`, статус не в архиве → `auto_unpublished = TRUE, published = FALSE`. Уведомление владельцу.

### 13. Маркетплейс не показывает истёкшие
- GET `/objects` возвращает только `published = TRUE AND status = 'Активен' AND auto_unpublished = FALSE AND (expires_at IS NULL OR expires_at > NOW())`.
