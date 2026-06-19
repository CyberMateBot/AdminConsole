# Admin API — спецификация для бэкенд-агента

Базовый префикс: `/api/admin`

Авторизация: заголовок `Authorization: Bearer <admin_jwt>` на всех эндпоинтах, кроме логина.

Формат ошибок (единый):

```json
{
  "error": "human readable message",
  "code": "OPTIONAL_ERROR_CODE"
}
```

---

## Auth

### `POST /api/admin/auth/login`

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "secret"
}
```

**Response 200:**
```json
{
  "token": "jwt-token",
  "admin": {
    "id": 1,
    "email": "admin@example.com"
  }
}
```

**Errors:** `401` — неверные credentials

---

### `POST /api/admin/auth/logout`

**Response:** `204 No Content`

---

### `GET /api/admin/auth/me`

**Response 200:**
```json
{
  "id": 1,
  "email": "admin@example.com"
}
```

---

## Stats

### `GET /api/admin/stats`

**Response 200:**
```json
{
  "total_users": 1000,
  "active_users_today": 42,
  "new_users_today": 5,
  "total_messages": 15000
}
```

---

## Users

### `GET /api/admin/users`

Список пользователей с пагинацией.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 1 | Номер страницы |
| `per_page` | int | 20 | Записей на страницу (max 100) |
| `search` | string | — | Поиск по `username`, `first_name`, `last_name` |

**Response 200:**
```json
{
  "data": [
    {
      "id": 1,
      "telegram_id": 123456789,
      "username": "ivan",
      "first_name": "Иван",
      "last_name": "Петров",
      "is_active": true,
      "tokens": 1500,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 100
}
```

**Требования к полю `tokens`:**
- `integer >= 0`
- обязательно в списке и в деталях пользователя

---

### `GET /api/admin/users/:id`

**Response 200:**
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "username": "ivan",
  "first_name": "Иван",
  "last_name": "Петров",
  "is_active": true,
  "tokens": 1500,
  "created_at": "2025-01-15T10:00:00Z"
}
```

**Errors:** `404` — пользователь не найден

---

### `PATCH /api/admin/users/:id`

Блокировка / разблокировка.

**Body:**
```json
{
  "is_active": false
}
```

**Response 200:** объект пользователя (как в `GET /api/admin/users/:id`)

---

### `DELETE /api/admin/users/:id`

**Response:** `204 No Content`

**Errors:** `404` — пользователь не найден

---

## Tokens (новое — реализовать на бэкенде)

Операции с балансом токенов отдельного пользователя. Все изменения должны быть **атомарными** (транзакция в БД) и **логироваться** (желательно таблица `token_transactions`).

### `POST /api/admin/users/:id/tokens/credit`

Начисление токенов.

**Body:**
```json
{
  "amount": 100,
  "reason": "Бонус за активность"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `amount` | integer | да | `> 0` |
| `reason` | string | нет | max 255 символов |

**Response 200:**
```json
{
  "user_id": 1,
  "tokens": 1600,
  "delta": 100,
  "operation": "credit"
}
```

**Логика:**
1. Найти пользователя по `id`
2. `tokens = tokens + amount`
3. Записать транзакцию: `{ user_id, admin_id, operation: "credit", amount, reason, balance_after }`
4. Вернуть новый баланс

**Errors:**
- `404` — пользователь не найден
- `422` — `amount` не целое или `<= 0`

---

### `POST /api/admin/users/:id/tokens/debit`

Списание токенов.

**Body:**
```json
{
  "amount": 50,
  "reason": "Корректировка баланса"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `amount` | integer | да | `> 0` |
| `reason` | string | нет | max 255 символов |

**Response 200:**
```json
{
  "user_id": 1,
  "tokens": 1550,
  "delta": -50,
  "operation": "debit"
}
```

**Логика:**
1. Найти пользователя по `id`
2. Если `tokens < amount` → `422` с `error: "Insufficient tokens"`
3. `tokens = tokens - amount`
4. Записать транзакцию
5. Вернуть новый баланс

**Errors:**
- `404` — пользователь не найден
- `422` — недостаточно токенов или невалидный `amount`

---

### (Опционально) `GET /api/admin/users/:id/tokens/history`

История операций с токенами — для будущего UI.

**Query:** `page`, `per_page`

**Response 200:**
```json
{
  "data": [
    {
      "id": 10,
      "operation": "credit",
      "amount": 100,
      "balance_after": 1600,
      "reason": "Бонус",
      "admin_id": 1,
      "created_at": "2026-03-20T12:00:00Z"
    }
  ],
  "total": 5
}
```

---

## Broadcast

### `POST /api/admin/broadcast`

**Body:**
```json
{
  "message": "Текст рассылки",
  "target": "all",
  "parse_mode": "HTML"
}
```

`target`: `"all"` | `"active"` (активные за 7 дней)

**Response 200:**
```json
{
  "sent": 950,
  "failed": 2
}
```

---

## Модель данных (рекомендация)

### `users` — добавить поле:
```sql
tokens INTEGER NOT NULL DEFAULT 0 CHECK (tokens >= 0)
```

### `token_transactions` (новая таблица):
```sql
CREATE TABLE token_transactions (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  admin_id    BIGINT NOT NULL REFERENCES admins(id),
  operation   VARCHAR(10) NOT NULL CHECK (operation IN ('credit', 'debit')),
  amount      INTEGER NOT NULL CHECK (amount > 0),
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  reason      VARCHAR(255),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## CORS (prod)

Разрешить origin админ-панели, методы `GET POST PATCH DELETE`, заголовки `Authorization`, `Content-Type`.

## Dev

Бэкенд на `http://127.0.0.1:8090`, Vite proxy `/api` → бэкенд.
