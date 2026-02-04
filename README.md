# Zootopia Clicker

Telegram Mini App (TON + Telegram WebApp) с единой авторизацией через initData, серверным прогрессом и локальным TonConnect UI.

## Frontend (static)
- `js/config.js` — конфигурация (API base, manifestUrl, buildId).
- `js/api.js` — HTTP-клиент с retry/backoff.
- `js/auth.js` — Telegram initData → JWT.
- `js/state_store.js` — единый store.
- `js/state_sync.js` — синхронизация состояния и команд.
- `js/error_boundary.js` — глобальная обработка ошибок.

## Backend (Node.js)
Единый обработчик `backend/index.js` для авторизации, состояния, команд и кошелька. Таблицы создаются автоматически при первом запросе.

### Переменные окружения
- `DATABASE_URL` — строка подключения к Postgres.
- `BOT_TOKEN` — токен бота Telegram.
- `JWT_SECRET` — секрет JWT.
- `TONCENTER_API_KEY` — опционально для TonCenter.
- `CORS_ORIGINS` — whitelist origin.

## Деплой (Yandex Cloud)
Подробные шаги в [`backend/README.md`](backend/README.md).

## Запуск тестов
```bash
node backend/tests/auth.test.js
node backend/tests/state.test.js
```
