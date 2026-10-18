# JanaMen — контракт API

Контракт для MVP по plan.md и db.md. Фиксируется в первые часы, фронт работает на мок-данных по этому контракту, бэкенд реализует его один в один. Актуальная живая документация генерируется Scramble (раздел 13).

---

## 1. Общие соглашения

### 1.1. Базовый адрес и версия

- Все эндпоинты платформы: `/api/v1/...`.
- Фронт и API отдаются с одного домена через nginx, поэтому CORS не нужен.
- Моки внешних систем: `/api/mock/...` (раздел 12). Они имитируют 1С:ЗУП и Documentolog и при подключении реальных систем исчезают.

### 1.2. Заголовки

| Заголовок | Значение | Когда |
|---|---|---|
| `Accept` | `application/json` | всегда |
| `Content-Type` | `application/json` | запросы с телом |
| `Accept-Language` | `ru` / `kz` / `en` | всегда; влияет на язык `message` в ошибках и язык ответа AI Jana |
| `X-XSRF-TOKEN` | значение cookie `XSRF-TOKEN` | все изменяющие запросы (POST, PATCH, DELETE); axios подставляет автоматически |

### 1.3. Авторизация

Sanctum в SPA-режиме, сессия в httpOnly cookie.

1. `GET /sanctum/csrf-cookie` — получить CSRF-cookie (один раз при старте приложения и после ошибки 419).
2. `POST /api/v1/auth/login` — вход, сервер ставит cookie сессии.
3. Дальше все запросы идут с cookie автоматически.

Запасной план: Bearer-токены (`Authorization: Bearer <token>`), формат остальных запросов не меняется.

### 1.4. Форматы данных

- Дата: `YYYY-MM-DD` (`"2026-11-02"`).
- Дата и время: ISO 8601 в UTC (`"2026-10-17T05:30:00Z"`). В часовой пояс пользователя переводит фронт.
- Идентификаторы — числа. Исключение: уведомления (`uuid`) и разделы базы знаний (строковый `key`).
- Статусы, типы, роли, действия и коды ошибок — строковые коды на английском (справочник в db.md, раздел 2). Подписи переводит фронт.
- Пустое значение — `null`, поле не пропускается.

### 1.5. Обёртка ответа

Одиночный объект:

```json
{ "data": { ... } }
```

Список с пагинацией:

```json
{
  "data": [ ... ],
  "meta": { "current_page": 1, "per_page": 20, "total": 57, "last_page": 3 }
}
```

Параметры пагинации: `page` (по умолчанию 1), `per_page` (по умолчанию 20, максимум 100). Сортировка по умолчанию — сначала новые.

Успешные действия без тела возвращают `204 No Content`.

### 1.6. Формат ошибки

Все ошибки приходят в одном формате (Laravel exception handler приводит к нему стандартные исключения и ошибки валидации):

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Проверьте заполнение полей",
    "fields": {
      "start_date": ["date_in_past"],
      "end_date": ["end_before_start"]
    }
  }
}
```

- `code` — машинный код, по нему фронт выбирает текст из i18n.
- `message` — запасной текст на языке из `Accept-Language`.
- `fields` — только при ошибках валидации: поле → массив кодов ошибок.

### 1.7. HTTP-статусы и общие коды ошибок

| HTTP | `code` | Когда |
|---|---|---|
| 401 | `unauthenticated` | нет сессии или она истекла → фронт ведёт на логин |
| 403 | `forbidden` | сущность существует, но нет прав (чужая заявка, не тот раздел) |
| 403 | `self_approval_forbidden` | попытка согласовать собственную заявку |
| 403 | `already_participated` | пользователь уже согласовывал эту заявку на другом шаге (правило «двух ключей») |
| 404 | `not_found` | сущности нет |
| 409 | `invalid_transition` | действие недопустимо в текущем статусе заявки |
| 409 | `already_escalated` | вопрос AI уже передан в HR |
| 419 | `csrf_token_mismatch` | CSRF-токен устарел → фронт повторяет `GET /sanctum/csrf-cookie` и запрос |
| 422 | `validation_failed` | ошибки полей (см. `fields`) |
| 422 | `invalid_credentials` | неверный логин или пароль |
| 422 | `comment_required` | отклонение без комментария |
| 422 | `no_available_approver` | для маршрута заявки нет допустимого согласующего |
| 429 | `too_many_requests` | превышен лимит запросов |
| 500 | `server_error` | непредвиденная ошибка |

**Коды ошибок полей** (значения в `fields`): `required`, `invalid_format`, `too_long`, `invalid_value`, `date_in_past`, `end_before_start`, `dates_overlap`, `insufficient_balance`, `invalid_option`, `incomplete_answers`.

### 1.8. Лимиты

| Эндпоинт | Лимит |
|---|---|
| `POST /auth/login` | 5 в минуту на IP |
| `POST /ai/ask` | 10 в минуту на пользователя |
| остальные | 120 в минуту на пользователя |

---

## 2. Общие объекты

Объекты, которые повторяются в ответах. Дальше в разделах на них ссылаемся по имени.

### UserBrief

Краткая карточка пользователя (автор заявки, согласующий, участник истории).

```json
{ "id": 5, "full_name": "Сейткали Асель Маратовна", "position": "Специалист по логистике" }
```

`id` — это `users.id`.

### VacationSummary

```json
{ "balance_days": 24, "reserved_days": 7, "available_days": 17 }
```

- `balance_days` — остаток по данным 1С;
- `reserved_days` — дни в активных заявках (`pending_manager`, `pending_hr`, `awaiting_signature`);
- `available_days` = `balance_days` − `reserved_days`.

### Request (элемент списка)

```json
{
  "id": 42,
  "type": "vacation",
  "status": "pending_manager",
  "author": { "id": 5, "full_name": "Сейткали Асель Маратовна", "position": "Специалист по логистике" },
  "payload": {
    "vacation_type": "annual_paid",
    "start_date": "2026-11-02",
    "end_date": "2026-11-15",
    "days": 14,
    "comment": "Семейная поездка",
    "document_ref": null
  },
  "current_step": "manager",
  "created_at": "2026-10-17T05:30:00Z",
  "updated_at": "2026-10-17T05:30:00Z"
}
```

- `payload` зависит от `type` (db.md, раздел 3.2).
- `current_step`: `manager` / `hr` / `signature` / `null` (для завершённых заявок).

### RequestDetail (карточка)

Всё из `Request` плюс:

```json
{
  "current_approver": { "id": 3, "full_name": "Ахметов Ерлан Болатович", "position": "Руководитель отдела логистики" },
  "available_actions": ["cancel"],
  "history": [
    {
      "id": 101,
      "action": "create",
      "from_status": null,
      "to_status": "pending_manager",
      "actor": { "id": 5, "full_name": "Сейткали Асель Маратовна", "position": "Специалист по логистике" },
      "comment": null,
      "created_at": "2026-10-17T05:30:00Z"
    }
  ]
}
```

- `current_approver` — конкретный согласующий на шаге руководителя; на шаге HR — `null` (действует любой допустимый HR).
- `available_actions` — **какие действия текущий пользователь может выполнить с этой заявкой прямо сейчас**. Вычисляется на бэкенде теми же Policy, что проверяют действие. Фронт показывает кнопки только по этому списку и не дублирует логику прав.

### Notification

```json
{
  "id": "9b2f1c4e-6a0d-4f3e-9d61-1f2c3b4a5d6e",
  "event": "request_status_changed",
  "message_key": "notifications.request_status_changed",
  "params": { "request_id": 42, "status": "pending_hr" },
  "link": { "entity_type": "request", "entity_id": 42 },
  "read_at": null,
  "created_at": "2026-10-17T06:10:00Z"
}
```

Коды `event`: `request_created`, `request_status_changed`, `request_answered`, `course_assigned`, `course_completed`.

`link.entity_type`: `request` / `course`. Фронт строит путь сам: `/requests/42`, `/courses/3`.

### CourseAssignment

```json
{
  "course": {
    "id": 1,
    "slug": "welcome",
    "title": "Добро пожаловать в Jana Post",
    "description": "Ценности, структура компании, как пользоваться JanaMen",
    "chapters_count": 3
  },
  "assignment": {
    "id": 17,
    "status": "in_progress",
    "progress_percent": 33,
    "due_date": "2026-10-31",
    "assigned_at": "2026-10-10T04:00:00Z",
    "completed_at": null
  }
}
```

---

## 3. Сводная таблица эндпоинтов

Роли: **E** — любой авторизованный (работник), **M** — есть подчинённые, **H** — роль `hr`, **S** — служебный доступ (мок-интеграции).

| Метод | Путь | Кто | Назначение |
|---|---|---|---|
| GET | `/sanctum/csrf-cookie` | все | CSRF-cookie |
| POST | `/api/v1/auth/login` | все | вход |
| POST | `/api/v1/auth/logout` | E | выход |
| GET | `/api/v1/me` | E | текущий пользователь |
| PATCH | `/api/v1/me` | E | смена языка интерфейса |
| GET | `/api/v1/dashboard` | E | данные дашборда |
| GET | `/api/v1/profile` | E | свой профиль из 1С |
| POST | `/api/v1/profile/corrections` | E | «Сообщить о неточности» |
| GET | `/api/v1/requests` | E | мои заявки |
| POST | `/api/v1/requests` | E | создать заявку |
| GET | `/api/v1/requests/{id}` | E, M, H | карточка заявки |
| POST | `/api/v1/requests/{id}/actions` | E, M, H | действие по заявке |
| GET | `/api/v1/team/employees` | M | мои подчинённые |
| GET | `/api/v1/team/requests` | M | заявки подчинённых |
| GET | `/api/v1/hr/requests` | H | очередь и все заявки |
| GET | `/api/v1/hr/employees` | H | все сотрудники |
| GET | `/api/v1/hr/employees/{id}` | H | карточка сотрудника |
| GET | `/api/v1/hr/departments` | H | подразделения |
| GET | `/api/v1/hr/courses` | H | курсы со статистикой |
| GET | `/api/v1/hr/course-assignments` | H | прогресс по назначениям |
| POST | `/api/v1/hr/course-assignments` | H | назначить курс |
| GET | `/api/v1/hr/integration-logs` | H | журнал интеграций |
| GET | `/api/v1/hr/ai-messages` | H | вопросы к AI (Could) |
| GET | `/api/v1/notifications` | E | список уведомлений |
| GET | `/api/v1/notifications/unread-count` | E | счётчик для polling |
| POST | `/api/v1/notifications/{id}/read` | E | прочитать одно |
| POST | `/api/v1/notifications/read-all` | E | прочитать все |
| GET | `/api/v1/courses` | E | мои курсы |
| GET | `/api/v1/courses/{courseId}` | E | курс с главами и прогрессом |
| GET | `/api/v1/courses/{courseId}/chapters/{chapterId}` | E | глава: материал и тест |
| POST | `/api/v1/courses/{courseId}/chapters/{chapterId}/viewed` | E | «Изучил» |
| POST | `/api/v1/courses/{courseId}/chapters/{chapterId}/quiz` | E | отправить тест |
| GET | `/api/v1/kb/documents` | E | список документов базы знаний |
| GET | `/api/v1/kb/documents/{slug}` | E | документ с разделами |
| POST | `/api/v1/ai/ask` | E | вопрос AI Jana |
| POST | `/api/v1/ai/messages/{id}/escalate` | E | передать вопрос в HR |
| POST | `/api/v1/ai/messages/{id}/rating` | E | оценка ответа (Could) |
| GET | `/api/health` | все | проверка состояния |
| GET | `/api/mock/onec/employees` | S | мок 1С: сотрудники |
| POST | `/api/mock/onec/vacation-orders` | S | мок 1С: приказ об отпуске |
| POST | `/api/mock/documentolog/documents` | S | мок Documentolog: документ на подпись |

Работник, руководитель и HR — это одна и та же учётная запись с разными правами. Поэтому разделы E доступны всем ролям, а M и H — дополнительно.

---

## 4. Авторизация и текущий пользователь

### POST `/api/v1/auth/login`

Запрос:

```json
{ "email": "a.seitkali@janapost.demo", "password": "demo-password" }
```

Ответ `200`: объект `Me` (см. `GET /me`).

Ошибки: `422 validation_failed` (пустые поля), `422 invalid_credentials`, `429 too_many_requests`.

### POST `/api/v1/auth/logout`

Ответ `204`.

### GET `/api/v1/me`

Ответ `200`:

```json
{
  "data": {
    "id": 5,
    "email": "a.seitkali@janapost.demo",
    "role": "employee",
    "locale": "ru",
    "employee": {
      "id": 12,
      "full_name": "Сейткали Асель Маратовна",
      "position": "Специалист по логистике",
      "department": { "id": 3, "name": "Отдел логистики" }
    },
    "abilities": {
      "team": false,
      "hr": false
    }
  }
}
```

- `abilities.team` — есть подчинённые (показывать раздел «Моя команда»);
- `abilities.hr` — роль `hr` (показывать HR-разделы).

Фронт строит меню по `abilities`, но доступ всё равно проверяет бэкенд.

Ошибки: `401 unauthenticated`.

### PATCH `/api/v1/me`

Единственное изменяемое поле пользователя — язык интерфейса.

Запрос:

```json
{ "locale": "kz" }
```

Ответ `200`: обновлённый `Me`.

Ошибки: `422 validation_failed` (`locale: ["invalid_value"]`).

---

## 5. Дашборд и профиль

### GET `/api/v1/dashboard`

Агрегат для главного экрана одним запросом.

Ответ `200`:

```json
{
  "data": {
    "profile": {
      "full_name": "Сейткали Асель Маратовна",
      "position": "Специалист по логистике",
      "department": "Отдел логистики"
    },
    "vacation": { "balance_days": 24, "reserved_days": 7, "available_days": 17 },
    "recent_requests": [ "Request", "Request" ],
    "courses": [ "CourseAssignment" ],
    "notifications": {
      "unread_count": 2,
      "latest": [ "Notification", "Notification", "Notification" ]
    },
    "team_pending_count": null,
    "hr_queue_count": null
  }
}
```

- `recent_requests` — до 5 последних заявок пользователя;
- `courses` — все назначенные курсы;
- `notifications.latest` — до 5 последних уведомлений;
- `team_pending_count` — число заявок, ждущих согласования пользователем как руководителем (`null`, если подчинённых нет);
- `hr_queue_count` — размер очереди HR без собственных заявок (`null`, если роль не `hr`).

### GET `/api/v1/profile`

Ответ `200`:

```json
{
  "data": {
    "last_name": "Сейткали",
    "first_name": "Асель",
    "middle_name": "Маратовна",
    "full_name": "Сейткали Асель Маратовна",
    "company": "ТОО «Jana Post»",
    "position": "Специалист по логистике",
    "department": { "id": 3, "name": "Отдел логистики" },
    "manager": { "full_name": "Ахметов Ерлан Болатович", "position": "Руководитель отдела логистики" },
    "hired_at": "2023-03-15",
    "vacation": { "balance_days": 24, "reserved_days": 7, "available_days": 17 },
    "source": { "system": "onec_zup", "synced_at": "2026-10-17T03:00:00Z" }
  }
}
```

`manager` — `null` для верха структуры. Назначенное обучение и уведомления фронт берёт из `GET /courses` и `GET /notifications`.

Изменить данные профиля через API нельзя: эндпоинтов PUT/PATCH для профиля нет.

### POST `/api/v1/profile/corrections`

«Сообщить о неточности». Создаёт заявку `hr_question` с `topic = profile_correction`.

Запрос:

```json
{ "message": "Неверно указана дата приёма, должно быть 01.03.2023" }
```

Ответ `201`: `RequestDetail` (тип `hr_question`, статус `open`).

Ошибки: `422 validation_failed` (`message: ["required"]`, `["too_long"]`, максимум 2000 символов).

---

## 6. Заявки

### GET `/api/v1/requests`

Мои заявки (только где я автор).

Параметры запроса: `status`, `type`, `page`, `per_page`.

Ответ `200`: список `Request` с пагинацией.

### POST `/api/v1/requests`

Создание заявки. Тип задаётся полем `type`, состав `payload` зависит от типа.

**Отпуск:**

```json
{
  "type": "vacation",
  "payload": {
    "vacation_type": "annual_paid",
    "start_date": "2026-11-02",
    "end_date": "2026-11-15",
    "comment": "Семейная поездка"
  }
}
```

`days` клиент не передаёт: сервер считает календарные дни сам и возвращает в ответе.

**Аванс (если успеем):**

```json
{
  "type": "advance",
  "payload": { "amount": 150000, "reason": "Личные обстоятельства", "comment": null }
}
```

Тип `hr_question` через этот эндпоинт не создаётся: только через `/profile/corrections` и `/ai/messages/{id}/escalate`.

Ответ `201`: `RequestDetail`. Статус — `pending_manager`, если у автора есть руководитель, иначе `pending_hr`.

Ошибки:

| HTTP | `code` | Поля / причина |
|---|---|---|
| 422 | `validation_failed` | `type: ["invalid_value"]`; `payload.vacation_type: ["required", "invalid_value"]`; `payload.start_date: ["required", "invalid_format", "date_in_past"]`; `payload.end_date: ["end_before_start"]`; `payload.start_date: ["dates_overlap"]`; `payload.end_date: ["insufficient_balance"]`; `payload.comment: ["too_long"]` |
| 422 | `no_available_approver` | для одного из шагов маршрута нет допустимого согласующего |

Пример ответа с ошибкой:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Проверьте заполнение полей",
    "fields": {
      "payload.end_date": ["insufficient_balance"]
    }
  }
}
```

### GET `/api/v1/requests/{id}`

Карточка заявки с историей и доступными действиями.

Кто может открыть:
- автор;
- непосредственный руководитель автора;
- HR (любую заявку).

Ответ `200`: `RequestDetail`.

Ошибки: `403 forbidden` (чужая заявка), `404 not_found`.

### POST `/api/v1/requests/{id}/actions`

Единый эндпоинт для всех переходов. Вся логика проверок — в сервисе state machine.

Запрос:

```json
{ "action": "manager_reject", "comment": "Пересекается с выездом на объект, перенеси на декабрь" }
```

| `action` | Кто | Из статуса | В статус | Тело |
|---|---|---|---|---|
| `manager_approve` | руководитель автора | `pending_manager` | `pending_hr` | `comment` — опционально |
| `manager_reject` | руководитель автора | `pending_manager` | `rejected` | `comment` — обязательно |
| `hr_approve` | HR (не автор, не участник) | `pending_hr` | `awaiting_signature` | `comment` — опционально |
| `hr_reject` | HR (не автор, не участник) | `pending_hr` | `rejected` | `comment` — обязательно |
| `sign` | HR (не автор) | `awaiting_signature` | `approved` | `comment` — опционально |
| `cancel` | автор | `pending_manager`, `pending_hr` | `cancelled` | `comment` — опционально |
| `answer` | HR (не автор) | `open` (`hr_question`) | `answered` | `answer` — обязательно |

Для ответа на обращение:

```json
{ "action": "answer", "answer": "Дата приёма исправлена в 1С, обновится после синхронизации" }
```

Побочные эффекты:
- `hr_approve` → вызов Documentolog (мок), в `payload.document_ref` записывается id документа, запись в журнал интеграций;
- `sign` → передача приказа в 1С:ЗУП (мок), остаток отпуска уменьшается, запись в журнал интеграций;
- любое действие → строка в истории и уведомления по правилам plan.md, раздел 6.3.

Ответ `200`: обновлённый `RequestDetail` (с новыми `status`, `history`, `available_actions`).

Ошибки:

| HTTP | `code` | Когда |
|---|---|---|
| 403 | `forbidden` | нет прав на это действие (например, руководитель не автора) |
| 403 | `self_approval_forbidden` | HR пытается согласовать свою заявку |
| 403 | `already_participated` | пользователь уже согласовывал эту заявку на другом шаге |
| 404 | `not_found` | заявки нет |
| 409 | `invalid_transition` | действие недопустимо в текущем статусе (например, `sign` для `pending_hr`) |
| 422 | `comment_required` | `manager_reject` / `hr_reject` без комментария |
| 422 | `validation_failed` | `action: ["invalid_value"]`, `answer: ["required"]` |

---

## 7. Команда (руководитель)

Доступно, если у пользователя есть подчинённые. Иначе `403 forbidden`.

### GET `/api/v1/team/employees`

Только прямые подчинённые, урезанный набор полей.

Ответ `200`:

```json
{
  "data": [
    {
      "user_id": 5,
      "full_name": "Сейткали Асель Маратовна",
      "position": "Специалист по логистике",
      "vacation": { "balance_days": 24, "reserved_days": 7, "available_days": 17 },
      "on_vacation_now": false,
      "courses": { "assigned": 2, "completed": 1, "average_progress": 66 }
    }
  ]
}
```

Без пагинации (команда небольшая). Дата приёма, компания и другие поля не отдаются.

### GET `/api/v1/team/requests`

Заявки прямых подчинённых.

Параметры: `status` (по умолчанию все; для блока «Ждут моего согласования» — `pending_manager`), `type`, `page`, `per_page`.

Ответ `200`: список `Request` с пагинацией.

---

## 8. HR

Доступно только роли `hr`. Иначе `403 forbidden`.

### GET `/api/v1/hr/requests`

Параметры:
- `queue=true` — только заявки, требующие действия HR (`pending_hr`, `awaiting_signature`, `hr_question` в `open`), без собственных;
- `status`, `type`, `author_id`, `department_id`, `page`, `per_page`.

Ответ `200`: список `Request` с пагинацией. В очереди свои заявки HR не видит; во «всех заявках» видит, но в карточке у него не будет действий.

### GET `/api/v1/hr/employees`

Параметры: `search` (по ФИО), `department_id`, `page`, `per_page`.

Ответ `200`:

```json
{
  "data": [
    {
      "user_id": 5,
      "employee_id": 12,
      "full_name": "Сейткали Асель Маратовна",
      "position": "Специалист по логистике",
      "department": { "id": 3, "name": "Отдел логистики" },
      "role": "employee",
      "vacation": { "balance_days": 24, "reserved_days": 7, "available_days": 17 }
    }
  ],
  "meta": { "current_page": 1, "per_page": 20, "total": 8, "last_page": 1 }
}
```

### GET `/api/v1/hr/employees/{userId}`

Ответ `200`: полный профиль (как `GET /profile`) плюс:

```json
{
  "data": {
    "...": "поля профиля",
    "requests": [ "Request" ],
    "courses": [ "CourseAssignment" ]
  }
}
```

Ошибки: `404 not_found`.

### GET `/api/v1/hr/departments`

Для фильтров и назначения курса подразделению.

Ответ `200`:

```json
{ "data": [ { "id": 3, "name": "Отдел логистики", "parent_id": 1, "employees_count": 4 } ] }
```

### GET `/api/v1/hr/courses`

Ответ `200`:

```json
{
  "data": [
    {
      "id": 1,
      "slug": "welcome",
      "title": "Добро пожаловать в Jana Post",
      "chapters_count": 3,
      "stats": { "assigned": 8, "not_started": 2, "in_progress": 3, "completed": 3 }
    }
  ]
}
```

### GET `/api/v1/hr/course-assignments`

Параметры: `course_id`, `status`, `department_id`, `page`, `per_page`.

Ответ `200`:

```json
{
  "data": [
    {
      "id": 17,
      "course": { "id": 1, "title": "Добро пожаловать в Jana Post" },
      "user": { "id": 5, "full_name": "Сейткали Асель Маратовна", "position": "Специалист по логистике" },
      "status": "in_progress",
      "progress_percent": 33,
      "due_date": "2026-10-31",
      "completed_at": null
    }
  ],
  "meta": { "current_page": 1, "per_page": 20, "total": 8, "last_page": 1 }
}
```

### POST `/api/v1/hr/course-assignments`

Назначить курс списку сотрудников или всему подразделению. Передаётся ровно одно из `user_ids` / `department_id`.

Запрос:

```json
{ "course_id": 1, "user_ids": [5, 6, 7], "due_date": "2026-10-31" }
```

или

```json
{ "course_id": 1, "department_id": 3, "due_date": "2026-10-31" }
```

Ответ `201`:

```json
{ "data": { "created": 3, "skipped_already_assigned": 1 } }
```

Каждому новому назначенному отправляется уведомление `course_assigned`.

Ошибки: `422 validation_failed` (`course_id: ["required", "invalid_value"]`, `user_ids: ["required"]`, `due_date: ["date_in_past"]`).

### GET `/api/v1/hr/integration-logs`

Параметры: `system` (`onec_zup` / `documentolog`), `status`, `page`, `per_page`.

Ответ `200`:

```json
{
  "data": [
    {
      "id": 31,
      "system": "documentolog",
      "direction": "outbound",
      "operation": "create_signing_document",
      "entity": { "type": "request", "id": 42 },
      "status": "success",
      "message": "Документ «Приказ об отпуске» отправлен на подпись",
      "created_at": "2026-10-17T07:00:00Z"
    }
  ],
  "meta": { "current_page": 1, "per_page": 20, "total": 12, "last_page": 1 }
}
```

### GET `/api/v1/hr/ai-messages` (Could)

Параметры: `result` (например `not_found` для раздела «вопросы без ответа»), `page`, `per_page`.

Ответ `200`: список `{ id, user: UserBrief, question, result, source_keys, escalated_request_id, created_at }`.

---

## 9. Уведомления

### GET `/api/v1/notifications`

Параметры: `unread=true` (только непрочитанные), `page`, `per_page`.

Ответ `200`: список `Notification` с пагинацией.

### GET `/api/v1/notifications/unread-count`

Опрашивается фронтом раз в 15–30 секунд.

Ответ `200`:

```json
{ "data": { "count": 2, "latest_created_at": "2026-10-17T06:10:00Z" } }
```

Если `latest_created_at` новее, чем при прошлом опросе, фронт запрашивает список и показывает тост.

### POST `/api/v1/notifications/{id}/read`

Ответ `204`. Ошибки: `404 not_found` (в том числе чужое уведомление).

### POST `/api/v1/notifications/read-all`

Ответ `204`.

---

## 10. Jana Academy

Работник видит только назначенные ему курсы. Курс без назначения → `404 not_found`.

### GET `/api/v1/courses`

Ответ `200`: `{ "data": [ CourseAssignment ] }`.

### GET `/api/v1/courses/{courseId}`

Ответ `200`:

```json
{
  "data": {
    "id": 1,
    "title": "Добро пожаловать в Jana Post",
    "description": "Ценности, структура компании, как пользоваться JanaMen",
    "assignment": { "id": 17, "status": "in_progress", "progress_percent": 33, "due_date": "2026-10-31", "completed_at": null },
    "chapters": [
      {
        "id": 1,
        "position": 1,
        "title": "Наши ценности",
        "material_viewed": true,
        "passed": true,
        "completed": true,
        "last_score": 3,
        "max_score": 4,
        "attempts": 1
      },
      {
        "id": 2,
        "position": 2,
        "title": "Структура компании",
        "material_viewed": false,
        "passed": false,
        "completed": false,
        "last_score": null,
        "max_score": 3,
        "attempts": 0
      }
    ]
  }
}
```

### GET `/api/v1/courses/{courseId}/chapters/{chapterId}`

Ответ `200`:

```json
{
  "data": {
    "id": 1,
    "course_id": 1,
    "position": 1,
    "title": "Наши ценности",
    "content_md": "## Открытость\n\nМы говорим прямо...",
    "pass_threshold": 70,
    "questions": [
      {
        "id": 11,
        "position": 1,
        "text": "Какие три ценности лежат в основе Jana Post?",
        "options": [
          { "id": 101, "position": 1, "text": "Открытость, надёжность, результат" },
          { "id": 102, "position": 2, "text": "Скорость, цена, качество" }
        ]
      }
    ],
    "progress": { "material_viewed": true, "passed": false, "last_score": 2, "max_score": 4, "attempts": 1 }
  }
}
```

Признак правильного ответа (`is_correct`) **никогда не отдаётся**.

Ошибки: `404 not_found` (курс не назначен или глава не из этого курса).

### POST `/api/v1/courses/{courseId}/chapters/{chapterId}/viewed`

Кнопка «Изучил». Повторный вызов безопасен.

Ответ `200`:

```json
{
  "data": {
    "chapter": { "id": 1, "material_viewed": true, "passed": true, "completed": true },
    "course": { "status": "in_progress", "progress_percent": 33 }
  }
}
```

### POST `/api/v1/courses/{courseId}/chapters/{chapterId}/quiz`

Запрос (ответ на каждый вопрос главы):

```json
{
  "answers": [
    { "question_id": 11, "option_id": 101 },
    { "question_id": 12, "option_id": 105 }
  ]
}
```

Ответ `200`:

```json
{
  "data": {
    "score": 3,
    "max_score": 4,
    "percent": 75,
    "threshold": 70,
    "passed": true,
    "attempts": 2,
    "chapter": { "id": 1, "material_viewed": true, "passed": true, "completed": true },
    "course": { "status": "completed", "progress_percent": 100, "completed_at": "2026-10-17T08:00:00Z" }
  }
}
```

- Какие именно вопросы неверны, не сообщается, только общий счёт.
- Однажды сданная глава остаётся сданной, даже если пересдача хуже.
- При `progress_percent = 100` отправляются уведомления `course_completed` работнику, руководителю и HR.

Ошибки: `404 not_found`, `422 validation_failed` (`answers: ["incomplete_answers"]` — ответы не на все вопросы; `answers.0.option_id: ["invalid_option"]` — вариант не от этого вопроса).

---

## 11. База знаний и AI Jana

### GET `/api/v1/kb/documents`

Только документы, доступные роли пользователя. Язык — из параметра `language` или `Accept-Language` (если kz-версии нет, отдаётся ru).

Ответ `200`:

```json
{
  "data": [
    { "slug": "vacation-policy", "language": "ru", "title": "Положение об отпусках", "access_level": "all" },
    { "slug": "how-to-janamen", "language": "ru", "title": "Как пользоваться JanaMen", "access_level": "all" }
  ]
}
```

### GET `/api/v1/kb/documents/{slug}`

Ответ `200`:

```json
{
  "data": {
    "slug": "vacation-policy",
    "language": "ru",
    "title": "Положение об отпусках",
    "access_level": "all",
    "sections": [
      { "key": "vacation-policy.duration", "anchor": "duration", "title": "Продолжительность отпуска", "body": "Ежегодный оплачиваемый отпуск..." },
      { "key": "vacation-policy.how-to-apply", "anchor": "how-to-apply", "title": "Как подать заявку", "body": "..." }
    ]
  }
}
```

Ошибки: `403 forbidden` (документ уровня `manager` / `hr` для работника), `404 not_found`.

### POST `/api/v1/ai/ask`

Запрос:

```json
{ "question": "Сколько дней ежегодного отпуска мне положено?" }
```

Ответ `200` — найден ответ:

```json
{
  "data": {
    "message_id": 77,
    "result": "answered",
    "answer": "Ежегодный оплачиваемый отпуск составляет 24 календарных дня. Подать заявку можно на дашборде через сервис «Отпуск».",
    "sources": [
      {
        "key": "vacation-policy.duration",
        "document_slug": "vacation-policy",
        "document_title": "Положение об отпусках",
        "section_title": "Продолжительность отпуска",
        "anchor": "duration"
      }
    ],
    "can_escalate": true
  }
}
```

Ответ `200` — отказ (вопрос вне базы, ответ не прошёл проверку или AI недоступен):

```json
{
  "data": {
    "message_id": 78,
    "result": "not_found",
    "answer": null,
    "sources": [],
    "can_escalate": true
  }
}
```

- `result`: `answered` / `not_found` / `invalid_response` / `unavailable`.
- при result = not_found одно предложение от модели, называющее тему вопроса («Информации об оформлении ипотеки в базе знаний нет.»). В остальных случаях null. Фронт показывает его первым, затем стандартный текст отказа из i18n; если note = null, показывается только стандартный текст. Отображать как обычный текст, не как HTML.
- Недоступность AI (нет ключа, нет сети) — **не ошибка HTTP**, а `200` с `result = unavailable`. Так интерфейс одинаково обрабатывает все случаи, и демо не ломается.
- Ссылку на источник фронт строит сам: `/kb/{document_slug}#{anchor}`.
- Ответ модели приходит на языке `Accept-Language`.

Ошибки: `422 validation_failed` (`question: ["required", "too_long"]`, максимум 1000 символов), `429 too_many_requests`.

### POST `/api/v1/ai/messages/{id}/escalate`

Передать вопрос в HR. Создаёт заявку `hr_question` с `topic = ai_escalation`, исходным вопросом и ссылкой на `ai_message_id`.

Запрос (тело опционально):

```json
{ "comment": "Нужно уточнить для командировки в Алматы" }
```

Ответ `201`: `RequestDetail` (тип `hr_question`, статус `open`). HR получают уведомление `request_created`.

Ошибки: `403 forbidden` (чужое сообщение), `404 not_found`, `409 already_escalated`.

### POST `/api/v1/ai/messages/{id}/rating` (Could)

Запрос:

```json
{ "rating": 1 }
```

`rating`: `1` (👍) или `-1` (👎). Ответ `204`.

Ошибки: `403 forbidden`, `404 not_found`, `422 validation_failed`.

---

## 12. Служебные эндпоинты и моки интеграций

### GET `/api/health`

Для healthcheck в Docker Compose и проверки перед демо. Без авторизации.

Ответ `200`:

```json
{ "status": "ok", "db": "ok", "ai": "configured", "hr_source": "mock" }
```

`ai`: `configured` / `not_configured`.

### Моки внешних систем

Имитируют API 1С:ЗУП и Documentolog. Адаптеры платформы (`EmployeeDataSource`, `DocumentSigningService`) в режиме `mock` работают с этими данными, в режиме `http` будут обращаться к реальным системам с тем же контрактом.

Защита: заголовок `X-Integration-Token` со значением из `.env`. Без него — `401 unauthenticated`. Пользовательская сессия здесь не используется.

Формат ответа моков намеренно отличается от платформенного (без обёртки `data`): так выглядит «чужая» система, а адаптер переводит её формат в модель платформы.

#### GET `/api/mock/onec/employees`

Ответ `200`:

```json
{
  "employees": [
    {
      "external_id": "000012",
      "last_name": "Сейткали",
      "first_name": "Асель",
      "middle_name": "Маратовна",
      "company": "ТОО «Jana Post»",
      "position": "Специалист по логистике",
      "department": { "external_id": "DEP-03", "name": "Отдел логистики", "parent_external_id": "DEP-01" },
      "manager_external_id": "000003",
      "hired_at": "2023-03-15",
      "vacation_balance_days": 24
    }
  ],
  "generated_at": "2026-10-17T03:00:00Z"
}
```

#### POST `/api/mock/onec/vacation-orders`

Передача приказа об отпуске после перехода заявки в `approved`.

Запрос:

```json
{
  "employee_external_id": "000012",
  "request_id": 42,
  "start_date": "2026-11-02",
  "end_date": "2026-11-15",
  "days": 14
}
```

Ответ `201`:

```json
{ "order_id": "ORD-2026-0042", "employee_external_id": "000012", "vacation_balance_days": 10 }
```

Ошибки: `404` (сотрудник не найден), `422` (недостаточно остатка).

#### POST `/api/mock/documentolog/documents`

Создание документа на подпись при переходе заявки в `awaiting_signature`.

Запрос:

```json
{
  "template": "vacation_order",
  "request_id": 42,
  "employee_external_id": "000012",
  "fields": { "start_date": "2026-11-02", "end_date": "2026-11-15", "days": 14 }
}
```

Ответ `201`:

```json
{ "document_ref": "DOC-7f3a91", "status": "sent_for_signing" }
```

**Будущий webhook (не в MVP):** `POST /api/v1/webhooks/documentolog` с телом `{ "document_ref": "DOC-7f3a91", "status": "signed", "signed_at": "..." }` переведёт заявку в `approved` вместо кнопки HR «Документы подписаны». Описывается в README и на схеме архитектуры.

---

## 13. Документация API

- Swagger UI: `/docs/api` (Scramble).
- OpenAPI JSON: `/docs/api.json`.

Этот файл — договорённость команды на старте. После реализации источник правды — Scramble. При расхождении правим код или этот файл сразу, чтобы фронт и бэк не разъехались.
