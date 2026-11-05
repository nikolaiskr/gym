# LiftShift Mini — инструкция по запуску в Telegram

Приложение полностью готово. Хостинг — GitHub Pages (бесплатно, HTTPS из коробки).

## ⚠️ Важно про токен бота

**Токен бота НЕ нужно вставлять ни в код, ни в env, ни в GitHub Secrets.**
Это полностью статичное приложение — всё работает на устройстве пользователя,
авторизация в Telegram происходит автоматически. Токен, попавший в
frontend-код или репозиторий, виден всему интернету — им сможет
воспользоваться кто угодно. Он понадобится только если позже появится
серверный бэкенд (и жить будет на сервере, а не на фронте).

## Что понадобится от тебя

1. **Аккаунт GitHub** — для Pages.
2. **Telegram-аккаунт** — для @BotFather.
3. Токен бота просто сохрани у себя (BotFather выдаст на шаге 3).

---

## Шаг 1. Залить код на GitHub

Код уже собран в git-репозиторий (ветка `main`, первый коммит сделан).
Осталось:

1. Создай на [github.com/new](https://github.com/new) пустой репозиторий,
   например `liftshift-mini` (Public или Private — Pages работает с обоими
   на бесплатном плане, но для Private нужно включить Pages вручную).
2. Пришли мне ссылку на репозиторий и Personal Access Token
   (github.com → Settings → Developer settings → Personal access tokens →
   Tokens (classic) → `repo` scope) — я запушу код сам. Либо выполни сам:

```bash
cd liftshift-mini
git remote add origin https://github.com/ТВОЙ_ЛОГИН/liftshift-mini.git
git push -u origin main
```

## Шаг 2. Включить GitHub Pages

Workflow уже лежит в `.github/workflows/deploy.yml` — сборка и деплой
происходят автоматически при каждом пуше в `main`.

Один раз включи источник:
**Settings → Pages → Build and deployment → Source → GitHub Actions**.

Через ~1–2 минуты после пуша сайт будет доступен по адресу
`https://ТВОЙ_ЛОГИН.github.io/liftshift-mini/`
(точный URL виден в Settings → Pages и в шапке Actions-рана).

## Шаг 3. Создать бота и Mini App в @BotFather

1. [@BotFather](https://t.me/BotFather) → `/newbot` → имя и username бота.
   Сохрани выданный токен (только храни, никуда не вставляй).
2. `/newapp` → выбери бота → заполни:
   - **Title**: LiftShift Mini
   - **Short name**: liftshift
   - **URL**: `https://ТВОЙ_ЛОГИН.github.io/liftshift-mini/`
   - **Photo**: любая картинка 640×360
3. `/setmenubutton` → выбери бота → тот же URL → текст кнопки
   «Открыть трекер».
4. Открой чат с ботом и нажми кнопку меню — приложение запустится
   внутри Telegram.

## Проверка перед привязкой

Открой Pages-URL в обычном браузере: должен загрузиться интерфейс
(вне Telegram работает в режиме предпросмотра — без haptics и
MainButton, это нормально). Если видишь приложение — можно привязывать
к боту.

---

## Если позже захочешь синхронизацию между устройствами

Слой хранения вынесен в `src/lib/storage.ts`. Для бэкенда понадобятся:

- токен бота (живёт только на сервере!) — для проверки подписи `initData`;
- любой бесплатный сервер (Cloudflare Workers, Railway, VPS) + БД;
- Telegram ID приходит в `initDataUnsafe.user.id`.
