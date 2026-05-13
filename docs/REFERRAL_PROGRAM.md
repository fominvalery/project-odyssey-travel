# Реферальная программа Кабинет-24

Документ описывает механику начисления, расчёта баланса и вывода средств.
Изменяя код — обязательно сверяйся с этим документом и обновляй его.

## 1. События и начисления

| Событие | bonus_type | Сумма | Где начисляется |
|---|---|---|---|
| Реферал подтвердил email | `email_verified` | **+10 ₽** | `auth/handlers/verify_email.py`, `admin_verify_email.py` |
| Реферал создал первый объект | `first_object` | **+20 ₽** | `objects/index.py` (POST) |
| Реферал оплатил тариф (1-я линия) | `commission_line1` | **+15%** от суммы | `yookassa-webhook/index.py` |
| Реферал реферала оплатил (2-я линия) | `commission_line2` | **+5–10%** | `yookassa-webhook/index.py` |
| Реферал реферала реферала (3-я линия) | `commission_line3` | **+0–5%** | `yookassa-webhook/index.py` |
| Оплата тарифа баллами | `subscription_payment` | **−price** | `auth/handlers/pay_with_balance.py` |

### Уровни и проценты комиссий
| Уровень | Условие | Линия 1 | Линия 2 | Линия 3 | Вывод |
|---|---|---|---|---|---|
| Друг | ≥1 реферал | 15% | 5% | 0% | ❌ |
| Партнёр | ≥3 рефералов | 15% | 5% | 0% | ❌ |
| Бизнес | ≥10 рефералов | 15% | 5% | 0% | ✅ |
| Амбасадор | ≥30 рефералов | 15% | 5% | 0% | ✅ |
| Лидер | ≥100 рефералов | 15% | 10% | 5% | ✅ |

Супер-админ может вручную выставить уровень через `users.referral_level`.

## 2. Расчёт баланса (единая формула)

Источник правды: `backend/extensions/auth-email/auth/utils/balance.py`

```
earned   = SUM(referral_bonuses.amount WHERE referrer_id = user AND amount > 0)
spent    = SUM(ABS(amount) WHERE referrer_id = user AND amount < 0)
reserved = SUM(withdrawal_requests.amount WHERE user_id = user AND status IN ('pending','approved','paid'))
paid_out = SUM(withdrawal_requests.amount WHERE user_id = user AND status = 'paid')

available = max(earned - spent - reserved, 0)
```

**Важно:**
- Учитываются ВСЕ заявки на вывод (включая pending/approved), чтобы пользователь не мог
  потратить одни и те же деньги дважды.
- `paid_out` — отдельная цифра «уже выплачено» для UI (не используется для проверки).

## 3. Структура таблиц

### `referrals` — связи реферер → реферал
- `referrer_id`, `referred_id` (UUID, REFERENCES users)
- `referred_id` имеет UNIQUE — один пользователь = один реферер навсегда

### `referral_bonuses` — записи начислений и списаний
- `id` SERIAL
- `referrer_id`, `referred_id` (UUID)
- `bonus_type` VARCHAR(50)
- `amount` NUMERIC(10,2) — может быть отрицательной
- `description` TEXT
- `order_id` INTEGER — для commission_line* (FK на orders)
- **UNIQUE индексы (защита от дублей):**
  - `referral_bonuses_first_object_unique` (referrer_id, referred_id) WHERE bonus_type='first_object'
  - `referral_bonuses_email_verified_unique` (referrer_id, referred_id) WHERE bonus_type='email_verified'
  - `referral_bonuses_commission_order_unique` (referrer_id, order_id, bonus_type) WHERE order_id IS NOT NULL

### `withdrawal_requests` — заявки на вывод
- `user_id`, `entity_type` (ip/selfemployed/ooo), `full_name`, `inn`, `bank_name`, `bik`, `account`, `amount`, `comment`
- `status` ENUM: `pending` → `approved` → `paid` (или `rejected`)

## 4. Защита от race conditions

### Создание объекта (`backend/objects/index.py`)
- Используется `INSERT ... WHERE NOT EXISTS` для бонуса first_object
- Частичный UNIQUE индекс гарантирует однократность даже при параллельных запросах
- При ошибке делается `conn.rollback()` — основная транзакция объекта не страдает

### Оплата баллами (`pay_with_balance.py`)
- Открывается одна транзакция
- `calculate_balance_locked()` блокирует строки `referral_bonuses` и `withdrawal_requests` через `SELECT FOR UPDATE`
- Параллельный запрос ждёт окончания первой транзакции
- Списание + продление подписки в одной транзакции — либо всё, либо ничего

### Заявка на вывод (`withdrawal_request.py`)
- Та же защита: `calculate_balance_locked()` внутри транзакции
- Если запрошена сумма > available — заявка не создаётся
- Параллельные заявки невозможны: вторая увидит зарезервированную первой

### YooKassa webhook (`yookassa-webhook/index.py`)
- **Идемпотентность**: `UPDATE orders SET status='paid' WHERE id=? AND status != 'paid' RETURNING id`
- Бонусы начисляются ТОЛЬКО если UPDATE вернул строку (т.е. этот webhook первым обработал)
- Дополнительно: `INSERT ... WHERE NOT EXISTS` для commission_line1/2/3 — защита от дублей

## 5. Чек-лист ручной проверки

При изменении кода прогнать:

1. **Регистрация по ref-ссылке** → проверить `SELECT * FROM referrals WHERE referred_id = новый_user`
2. **Подтверждение email** → проверить запись `email_verified` 10 ₽ в `referral_bonuses`
3. **Создание первого объекта** → проверить запись `first_object` 20 ₽
4. **Создание второго объекта** → бонус **НЕ** должен начислиться повторно
5. **Оплата тарифа рефералом** → проверить commission_line1 (и 2/3 если есть)
6. **Повторный webhook** YooKassa с тем же payment_id → дубль НЕ создаётся
7. **Оплата тарифа баллами** при недостаточном балансе → 400 Bad Request
8. **Параллельные** запросы pay-with-balance — баланс не уйдёт в минус
9. **Заявка на вывод** на сумму больше доступного → 400 Bad Request
10. **Две заявки на вывод подряд** в сумме больше баланса → вторая отклоняется

## 6. Backend-функции реферальной программы

| Функция | Endpoint | Описание |
|---|---|---|
| `auth?action=referral-stats` | GET | Статистика и баланс |
| `auth?action=pay-with-balance` | POST | Оплатить тариф баллами |
| `auth?action=withdrawal-request` | POST | Создать заявку на вывод |
| `auth?action=withdrawal-history` | GET | История заявок |
| `auth?action=admin-withdrawals` | GET/POST | Управление заявками (супер-админ) |
| `objects` (POST) | POST /objects | Создание объекта + бонус first_object |
| `auth?action=verify-email` | POST | Подтверждение email + бонус |
| `yookassa-webhook` | POST | Зачисление платежа + комиссии 3 линий |

## 7. Известные ограничения

1. **Self-referral**: `register.py` использует `LIKE ref_code + '%'` (первые 8 символов UUID).
   Теоретическая коллизия маловероятна, но не невозможна. TODO: использовать полный UUID.
2. **Возврат платежа** (refund) пока не откатывает уже начисленные комиссии — нужно будет
   реализовать обработку `payment.canceled` после `succeeded`.
3. **Ручная корректировка** `users.referral_level` супер-админом меняет уровень моментально,
   но уже начисленные комиссии не пересчитываются (это by design).

## 8. История миграций

- `V0022` — таблица `referral_bonuses`
- `V0023` — добавлен `order_id`, частичные UNIQUE для commissions
- `V0046` — UNIQUE для email_verified
- `V0047` — backfill бонусов задним числом
- `V0048` — индексы безопасности (withdrawal_requests, referral_bonuses_commission_order_unique)
