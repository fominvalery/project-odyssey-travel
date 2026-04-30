# Документация безопасности — Кабинет-24

Последнее обновление: 2026-04-30

---

## Архитектура защиты

Система использует трёхуровневую защиту:

1. **Фронтенд** — передаёт `X-User-Id` в заголовках всех приватных запросов
2. **Бэкенд** — проверяет заголовок и сверяет с правами в БД (не доверяет клиенту)
3. **База данных** — хранит роли, членства и права, которые нельзя подделать

---

## Заголовки авторизации

| Заголовок | Где используется | Описание |
|---|---|---|
| `X-User-Id` | objects, leads, agency, auth-email | ID текущего пользователя |
| `X-Admin-Token` | admin | Секретный токен из env `ADMIN_SECRET` |
| `Authorization` (→ `X-Authorization`) | auth-email | JWT Bearer токен (проксируется платформой) |

---

## Правила доступа к данным

### Объекты (`/objects`)

| Запрос | Требует заголовок | Условие доступа |
|---|---|---|
| GET маркетплейс (без user_id) | Нет | Публичный |
| GET /?user_id= | `X-User-Id` | caller == user_id ИЛИ коллега по организации |
| GET /?org_id= | `X-User-Id` | caller — активный член организации |
| POST, PUT, DELETE | `X-User-Id` в теле | Проверка owner в БД |

### Лиды (`/leads`)

| Запрос | Требует заголовок | Условие доступа |
|---|---|---|
| POST (создать заявку) | Нет | Публичный |
| GET /?owner_id= | `X-User-Id` | caller == owner_id ИЛИ коллега по организации |
| GET /?org_id= | `X-User-Id` | caller — активный член организации |
| PUT, DELETE | `X-User-Id` в теле | Проверка owner в БД |

### Реферальная статистика (`/auth?action=referral-stats`)

| Запрос | Условие доступа |
|---|---|
| GET /?user_id= | `X-User-Id` == user_id (только сам владелец) |

### Супер-Админ панель (`/auth?action=users-list`, `admin-withdrawals`, `update-status`)

| Запрос | Условие доступа |
|---|---|
| Любой | `X-User-Id` → проверка `is_superadmin = true` в БД |

> Важно: `actor_id` больше не принимается из query string — только из заголовка `X-User-Id`.

---

## Исправленные уязвимости

### Критичные (исправлено)

| # | Уязвимость | Файл | Статус |
|---|---|---|---|
| 1 | Доступ к лидам любого пользователя по owner_id без авторизации | `leads/index.py` | ✅ Исправлено |
| 2 | Доступ к объектам любого пользователя по user_id без авторизации | `objects/index.py` | ✅ Исправлено |
| 3 | SQL-инъекция через email при логине | `login/index.py:45` | ✅ Исправлено |
| 4 | SQL-инъекция через email при регистрации | `register/index.py:53` | ✅ Исправлено |
| 5 | Реферальная статистика с финансами доступна без проверки | `auth/handlers/referral_stats.py` | ✅ Исправлено |
| 6 | actor_id супер-админа можно передать из URL (имперсонация) | `users_list.py`, `admin_withdrawals.py`, `update_status.py` | ✅ Исправлено |

### Важные (исправлено)

| # | Уязвимость | Файл | Статус |
|---|---|---|---|
| 7 | Контакты собственника попадали в запрос к ИИ | `describe-object/index.py`, `WizardSteps.tsx` | ✅ Исправлено |
| 8 | `X-User-Id` не был разрешён в CORS заголовках auth-функции | `auth/utils/http.py` | ✅ Исправлено |
| 9 | Фронтенд не передавал `X-User-Id` при запросе referral-stats — данные не загружались | `DashboardSections.tsx` | ✅ Исправлено |

### Известные ограничения (не критично)

| # | Описание | Файл | Приоритет |
|---|---|---|---|
| A | `update-profile`, `chat`, `club-check` не проверяют X-User-Id на бэкенде — авторизация через user_id в теле | `auth/handlers/` | Средний |
| B | `lead-extras` не проверяет X-User-Id — авторизация через owner_id в параметрах | `lead-extras/index.py` | Средний |

---

## Конфигурация безопасности

### Пароли
- Хеширование: **bcrypt**
- Реализация: `login/index.py`, `register/index.py`

### JWT токены (auth-email расширение)
- Access token: короткоживущий
- Refresh token: хранится хеш в БД, отзывается при logout
- Rate limiting: 5 попыток входа, блокировка на 15 минут

### Приватные поля объектов (никогда не уходят в ИИ)
```
owner_name, owner_phone, owner_fee, owner_comment,
presentation_contact_name, presentation_contact_phone, presentation_contact_company
```

### ИИ-генерация описаний
- Приватные поля фильтруются на фронтенде до отправки
- Приватные поля фильтруются на бэкенде как второй барьер
- Телефоны/email из черновика вычищаются регулярными выражениями
- В промте явный запрет упоминать контактные данные

---

## Покрытие тестами

| Функция | Тестов | Тесты безопасности |
|---|---|---|
| objects | 7 | GET без X-User-Id → 403, GET с чужим X-User-Id → 403 |
| leads | 6 | GET без X-User-Id → 403, GET с чужим X-User-Id → 403 |
| lead-extras | 10 | GET без lead_id → 400, DELETE без params → 400 |
| joint-deals | 6 | GET без user_id → 400, PUT/PATCH без полей → 400 |
| object-chat | 5 | GET без params → 400, POST без object_id → 400 |
| admin | 4 | GET/DELETE без токена → 403, неверный токен → 403 |
| agency | 7 | GET без X-User-Id → 401, неизвестный action → 400 |
| login | 5 | Неверные данные → 401, несуществующий email → 401 |
| register | 4 | Отсутствие полей → 400 |
| upload-photo | 3 | Невалидный base64 → 400 |
| auth-email-auth | 12 | Referral stats без X-User-Id → 403, чужой user_id → 403 |
| notifications | 4 | GET без user_id → 400 |
| club | 4 | GET без user_id → 400 |
| describe-object | 2 | OPTIONS preflight, POST генерация |

---

## Backend функции

| Функция | Методы | Авторизация |
|---|---|---|
| objects | GET, POST, PUT, DELETE, PATCH | X-User-Id для приватных GET; owner проверка в БД для PUT/DELETE |
| leads | GET, POST, PUT, DELETE | X-User-Id для GET; owner проверка в БД для PUT/DELETE |
| agency | GET, POST, PUT, DELETE | X-User-Id + членство в организации |
| login | POST | Публичный (bcrypt проверка пароля) |
| register | POST | Публичный |
| admin | GET, DELETE | X-Admin-Token == ADMIN_SECRET |
| auth-email-auth | GET, POST | JWT токен или X-User-Id в зависимости от action |
| describe-object | POST | Публичный (данные фильтруются внутри) |
| upload-photo | POST | Публичный |
| notifications | GET, POST, PUT | По user_id |
| lead-extras | GET, POST, PUT, DELETE | По owner_id |
| object-chat | GET, POST | По session_id |
| joint-deals | GET, POST, PUT, PATCH | По user_id |
| generate-presentation | POST | Публичный |
| ai-assistant | POST | Публичный |
| subscription-checker | GET, POST | Внутренний (cron) |