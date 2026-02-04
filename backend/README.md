# Zootopia Clicker Backend

## Архитектура
Backend развёрнут как единый Node.js обработчик (Yandex Cloud Function или Serverless Container), который:
- проверяет Telegram initData и выдаёт JWT;
- хранит прогресс в Postgres;
- применяет команды по правилам античита и идемпотентности;
- хранит связанный кошелёк.

## Переменные окружения (Lockbox)
- `DATABASE_URL` — строка подключения к Postgres.
- `BOT_TOKEN` — токен Telegram бота для проверки initData.
- `JWT_SECRET` — секрет для подписи JWT.
- `TONCENTER_API_KEY` — при необходимости для ончейн запросов.
- `CORS_ORIGINS` — список origin через запятую (GitHub Pages + Telegram WebApp).

## Деплой (Yandex Cloud)
1. **Managed Postgres**
   - Создайте кластер Managed Postgres.
   - Создайте базу данных и пользователя.
   - Сформируйте `DATABASE_URL` и сохраните её в Lockbox.

2. **Lockbox**
   - Создайте секрет и добавьте ключи: `DATABASE_URL`, `BOT_TOKEN`, `JWT_SECRET`, `TONCENTER_API_KEY`.
   - При необходимости добавьте `CORS_ORIGINS`.
   - Дайте сервисному аккаунту функции доступ на чтение.

3. **Cloud Function / Serverless Container**
   - Разверните `backend/index.js` как entrypoint.
   - Подключите секрет Lockbox как переменные окружения.
   - Включите публичный HTTPS endpoint.

4. **Проверка**
   - `POST /auth/telegram` с `initData` должен вернуть JWT.
   - `GET /state` с `Authorization: Bearer <token>` должен вернуть прогресс.
   - `POST /command/tap` применяет команду.

## Локальная проверка
```bash
node backend/tests/auth.test.js
node backend/tests/state.test.js
```
