# Архитектура бэкенда

Документ описывает, как устроена серверная часть, почему она устроена именно
так и что нужно менять, если меняются требования. Правила оформления кода —
в `CLAUDE.md`.

## Карта

```
Браузер ─┬─ документ ───────────▶ server.ts ──▶ TanStack Start ──▶ роуты (SSR data-only)
         ├─ server functions ───▶ server.ts ──▶ userScopeMiddleware ──▶ *.api.ts ──▶ сервис
         └─ POST /api/generate ─▶ server.ts ──▶ userApiScopeMiddleware ──▶ генерация (NDJSON)

Clerk (Svix) ─▶ /api/webhooks/clerk ─▶ systemApiScopeMiddleware ─▶ maintenance / billing
Railway cron ─▶ /api/cron/:job ──────▶ systemApiScopeMiddleware ─▶ maintenance

сервисы ──▶ репозитории ──▶ Prisma (pg) ──▶ Postgres
сервисы ──▶ rate limiter / lock ─────────▶ Redis
сервис генерации ──▶ gateway ──▶ Generation API (SSE)
```

```
src/backend/
  config.server.ts        env (zod), разбирается один раз при старте
  errors.server.ts        AppError и наследники, публичный payload
  di/                     awilix: модули, контейнер, actor, scope на запрос
  middleware/             guards: auth + scope + бюджет, гигиена ошибок, CSRF
  database/               Prisma с драйвером pg, пулом и таймаутами
  redis/                  Redis-клиент, распределённый лок
  rate-limit/             политика бюджетов и лимитер (consumeAll с возвратом)
  gateways/               внешние API (Generation API + SSE-парсер)
  webhooks/               webhook Clerk: подпись, затем диспетчеризация
  jobs/                   cron-задачи: реестр и проверка секрета
  web/                    заголовки, тело запроса, NDJSON, IP, контекст запроса
  lifecycle/              health, graceful shutdown
  observability/          pino
src/features/<домен>/
  *.schema.ts             zod-схемы и DTO, общие для клиента и сервера
  *.api.ts                server functions: guard + валидатор + один вызов
  *.service.server.ts     бизнес-правила
  *.repository.server.ts  Prisma, всё ограничено владельцем
  *.module.server.ts      регистрации DI этой фичи
  *.queries.ts            фабрики TanStack Query для клиента
```

## Путь запроса

1. **`src/server.ts`** — точка входа на каждый запрос:
   - request-id (`X-Railway-Request-Id` или новый UUID) и IP клиента кладутся
     в `AsyncLocalStorage`;
   - запрос с `Content-Length` больше 1 МБ отклоняется с 413;
   - лимит по IP (600 в минуту). Health, webhook и cron исключены, у них
     свои бюджеты;
   - к каждому ответу добавляются заголовки безопасности и `X-Request-Id`.
2. **`src/start.ts`** — глобальные request middleware: CSRF для server
   functions, затем Clerk.
3. **Guard:**
   - для server functions — `userScopeMiddleware`;
   - для `/api` с cookie — `userApiScopeMiddleware` (он дополнительно
     проверяет CSRF);
   - для webhook и cron — `systemApiScopeMiddleware`.
4. **Scope.** Guard читает сессию Clerk (`authenticate`) и строит `UserActor`
   с `userId`, планом и правами. Затем списывает бюджет `user` и создаёт
   scope DI.
5. **Обработчик** вызывает сервис из `context.scope.cradle`. Ошибки
   нормализуются и логируются в одном месте
   (`middleware/error-handling.server.ts`), клиент получает только
   `{ code, retryAfterSeconds? }`.

## Внедрение зависимостей

- **Фабрики.** Все сервисы, репозитории и gateway — фабрики
  `createX({ deps })`.
- **Модули.** Каждая фича объявляет свои регистрации рядом с кодом
  (`*.module.server.ts`), инфраструктура — в `di/core.module.server.ts`.
  `container.server.ts` только объединяет модули. Тип cradle выводится из
  регистраций (`CradleOf`), поэтому рукописного интерфейса, который мог бы
  разойтись с фабриками, нет. Новая фича — одна строка в контейнере.
- **Время жизни:**
  - `singleton`: конфиг, клиенты, пулы, gateway, лимитер, лок;
  - `scoped`: сервисы и репозитории, один набор на запрос.
- **`strict: true`.** Awilix не позволит singleton-у захватить scoped-
  зависимость, например пользователя первого запроса.
- **`userActor`** регистрируется только в пользовательском scope. Если
  webhook или cron попробует получить пользовательский сервис, resolve
  упадёт, а не выполнится без владельца.

## Данные

- **Одна таблица `applications`.** Пользователей хранит Clerk, у нас только
  `user_id`.
- **UUID v7 как первичный ключ.** Он упорядочен по времени, поэтому
  `ORDER BY id DESC` даёт порядок создания, а пагинация идёт курсором по
  ключу (keyset): стоимость страницы не зависит от её номера, и строки не
  «прыгают» между страницами.
- **Soft delete (`deleted_at`).** Undo восстанавливает ту же строку, а не
  копию, присланную клиентом. Через 30 дней строку удаляет
  `/api/cron/purge-deleted-applications`.
- **Индексы:**
  - `(user_id, deleted_at, id DESC)` — дашборд и счётчик;
  - `(deleted_at)` — задача очистки.
- **Изоляция.** Каждый метод репозитория сам кладёт `userId` в `WHERE`. Чужая
  строка неотличима от несуществующей, поэтому IDOR невозможен по
  построению.
- **Гонки.** Лимит «не больше N писем» проверяется и записывается под
  транзакционным advisory-локом пользователя
  (`pg_advisory_xact_lock(hashtextextended(user_id, 0))`). Интеграционный
  тест запускает пять параллельных вставок при лимите 1.
- **Пул соединений** на процесс (`DATABASE_POOL_MAX`, по умолчанию 10).
  Сумма по репликам должна оставаться ниже `max_connections` базы.

## Генерация письма

```
POST /api/generate { applicationId?, input }
  1. тон из плана? иначе 403 plan_required
  2. письмо своё (для Try Again) или лимит писем не исчерпан
  3. лок в Redis «одна генерация на пользователя» (TTL 2 мин)
  4. бюджеты по порядку: пользователь в минуту → квота плана в день →
     общий бюджет upstream. При отказе уже списанное возвращается
  5. открывается поток к Generation API (таймауты: 30 с до первого байта,
     20 с простоя)
  6. дельты уходят в браузер как NDJSON
  7. после конца потока письмо сохраняется, и только потом отправляется
     done { application }
```

- **Ошибки до первого байта** возвращаются HTTP-статусом, после — событием
  `error` в потоке.
- **Обрыв потока** не сохраняет ничего. Если не удалось сохранить готовое
  письмо, клиент получает `save_failed` и оставляет текст на экране.
- **Отмена запроса браузером** (Stop, уход со страницы) обрывает и запрос к
  upstream, и лок.
- **Промпт** собирается только на сервере. Ввод пользователя передаётся
  внутри тегов как данные, угловые скобки экранируются. Поэтому эндпоинт
  не может служить открытым прокси к модели.

## Rate limiting

Счётчики хранятся в Redis (`rate-limiter-flexible`), поэтому лимиты
действуют сразу для всех реплик.

| Бюджет | Ключ | Лимит | Что защищает |
| --- | --- | --- | --- |
| `ip` | IP клиента | 600/мин | флуд, скрейпинг до аутентификации |
| `user` | пользователь | 300/мин | все вызовы пользователя |
| `generationMinute` | пользователь | 4/мин | серии «Try Again» |
| `generationDay` | пользователь | по плану (10 / 100) | квота плана → `quota_exceeded` |
| `upstream` | один на деплой | 6/мин | бюджет токена Generation API |
| `webhook` | источник + IP | 60/мин | webhook и cron |

- **IP клиента** берётся как самый правый адрес в `X-Forwarded-For`, потому
  что его дописывает edge Railway. Левые адреса клиент может подделать.
- **Redis недоступен.** Каждый бюджет переключается на лимитер в памяти того
  же размера. Лимиты тогда работают на процесс, то есть мягче, но не
  отключаются.
- **Смена плана.** Счётчик квоты у всех лимитов общий, а сравнивается с
  лимитом плана. Поэтому переход на Pro сохраняет уже потраченное и сразу
  поднимает потолок.

## Биллинг (Clerk Billing)

- **Каталог.** Планы и фичи описаны в `features/billing/billing.catalog.ts`,
  там же лимиты, которые они дают. В Clerk заводятся те же slug-и.
- **Проверка по фичам, не по плану.** Пример: `has({ feature:
  'extended_history' })`. Поэтому планы можно переупаковывать, не меняя код.
- **Источник прав — токен сессии.** Clerk кладёт план и фичи в claims, и
  `authenticate()` раз на запрос строит права без обращения к API Clerk.
  Своей копии подписки в БД нет, и расходиться ей не с чем.
- **Webhook-события биллинга** только логируются, для наблюдаемости. Past
  due и incomplete идут как предупреждения.

| План | Slug | Писем в день | Сохранённых писем | Тон |
| --- | --- | --- | --- | --- |
| Free | `free_user` (по умолчанию) | 10 | 20 | профессиональный |
| Pro | `pro` | 100 | 500 | профессиональный, тёплый, уверенный |

Фичи Pro: `extended_daily_quota`, `extended_history`, `letter_tones`.

Каталог для Clerk хранится в `clerk/billing.json` и применяется Clerk CLI:
`npx clerk@latest config patch --file clerk/billing.json` (с `--dry-run`
для предпросмотра, с `--instance prod` для продакшена). Названия и лимиты
в этом файле должны совпадать с `billing.catalog.ts`.

## Безопасность

- **Аутентификация.** Clerk: серверный guard на документы, отдельная
  проверка в каждом guard server functions и `/api`.
- **CSRF.**
  - server functions: `createCsrfMiddleware` глобально;
  - `/api` с cookie: `isCsrfRequestAllowed` в guard;
  - webhook: подпись Svix; cron: bearer-секрет со сравнением за постоянное
    время.
- **Ввод.** zod на каждом входе. `/api/generate` читает тело потоком с
  лимитом 16 КБ, не доверяя `Content-Length`.
- **Ошибки.** Наружу уходит только код. Стеки, `cause`, ответы провайдеров и
  метаданные Prisma остаются в логе.
- **Заголовки:**
  - CSP (`frame-ancestors 'none'`, `base-uri`, `object-src`, `form-action`);
  - `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`,
    COOP;
  - HSTS в продакшене.
  - `script-src` сознательно не задан: Clerk грузит UI и защиту от ботов
    со своих доменов. Для него нужна схема на nonce, а не угаданный
    allowlist.
- **Секреты** читает только сервер, pino редактирует их по путям.
- **Данные в браузере.** При выходе из аккаунта очищается кэш писем в
  `localStorage`. При удалении аккаунта в Clerk удаляются и письма.

## Эксплуатация

- **Health:**
  - `GET /api/health` — liveness, без зависимостей;
  - `GET /api/health/ready` — readiness: Postgres (обязателен) и Redis
    (только отчёт). Railway ждёт readiness перед переключением трафика.
- **Миграции** `prisma migrate deploy` выполняются в pre-deploy команде
  Railway, до запуска новой версии.
- **Инфраструктура как код** — `.railway/railway.ts`: Postgres, Redis,
  приложение и cron-сервис со всеми настройками деплоя. Изменения
  применяются не push-ем, а через `railway config plan` (предпросмотр) и
  `railway config apply`. Секреты — `preserve()`: они заданы в Railway и в
  репозиторий не попадают. Для работы команд нужен npm-пакет `railway`.
- **Graceful shutdown.** На SIGTERM HTTP-сервер дожидается текущих запросов,
  а мы закрываем пул Postgres и соединение Redis.
- **Логи** в формате JSON, у каждой строки `requestId` и `userId`. Индексируются
  Railway.
- **Cron.** Отдельный сервис Railway раз в сутки вызывает
  `POST /api/cron/purge-deleted-applications` с
  `Authorization: Bearer $CRON_SECRET`.

## Масштабирование

- **Реплики приложения без состояния.** Координация (лимиты, лок) живёт в
  Redis, данные в Postgres. Горизонтальное масштабирование — это число
  реплик плюс `DATABASE_POOL_MAX`.
- **Общий бюджет upstream** (6 запросов в минуту на токен) — это потолок
  всей системы по генерациям. Больше даст только другой контракт с
  провайдером. Лимитер гарантирует, что упрёмся в него вежливо, а не
  получим 429 от провайдера посреди потока.
- **Когда Postgres станет узким местом:** сначала read-реплика для списков,
  затем партиционирование `applications` по `user_id`. Keyset-пагинация и
  запросы, всегда ограниченные пользователем, к этому готовы.

## Тесты

| Уровень | Где | Что проверяет |
| --- | --- | --- |
| unit | `*.test.ts` | сервисы на фейках, SSE-парсер, gateway, промпт, протокол, автомат генерации |
| integration | `*.integration.test.ts` | репозиторий, лимитер и лок на настоящих Postgres и Redis (docker) |
| e2e | `e2e/` | продакшен-сборка против тестовой БД и фейкового Generation API, десктоп и мобильный |
