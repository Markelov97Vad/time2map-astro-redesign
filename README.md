# time2map.com

Статический сайт на [Astro 5](https://astro.build), мигрирован с Webflow.
Контент — в Markdown/YAML-файлах, опциональная визуальная админка — [Keystatic](https://keystatic.com) (только локально).

## Команды

| Команда | Что делает |
| --- | --- |
| `npm install` | Установить зависимости (один раз) |
| `npm run dev` | Дев-сервер: <http://localhost:4321>, админка: <http://localhost:4321/keystatic> |
| `npm run build` | Собрать продакшн-версию в `dist/` |
| `npm run preview` | Посмотреть собранную версию локально |

## Как редактировать контент

Всё содержимое сайта лежит в `src/content/`. Править можно тремя способами:
текстовым редактором, через админку Keystatic (`npm run dev` → `/keystatic`)
или попросить LLM («добавь новый кейс про …»).

| Что | Где |
| --- | --- |
| Глобальные настройки (email, ссылки, соцсети, форма) | [src/content/site.yaml](src/content/site.yaml) |
| Главная страница (hero, услуги, процесс, технологии, CTA) | [src/content/pages/home.yaml](src/content/pages/home.yaml) |
| Кейсы (Use Cases) | `src/content/use-cases/*.md` — один файл = один кейс |
| Статьи LAB | `src/content/lab/*.md` — один файл = одна статья |
| FAQ на главной | `src/content/faq/*.md` — один файл = один вопрос |
| Отзывы | `src/content/testimonials/*.yaml` |
| Картинки | `public/images/...` (в md указываются как `/images/...`) |

### Добавить новый кейс

Создайте `src/content/use-cases/my-project.md`:

```markdown
---
title: Название проекта
order: 8            # позиция на странице Use Cases
featured: false     # true = показывать на главной в «See Our Work»
tags:
  - python
  - mapbox
images:
  - /images/use-cases/my-project-1.webp
tryItUrl: https://example.com   # необязательно — кнопка «Try it»
---

Описание проекта. Поддерживается **markdown** и [ссылки](https://example.com).
```

Положите скриншоты в `public/images/use-cases/` — готово.

### Добавить статью LAB

Подробные пошаговые инструкции (frontmatter, роли заголовков, авто-нумерация
находок, SEO-чеклист) — в `docs/`:

- 🇷🇺 [docs/adding-a-lab-article.ru.md](docs/adding-a-lab-article.ru.md)
- 🇬🇧 [docs/adding-a-lab-article.en.md](docs/adding-a-lab-article.en.md)

Коротко: создайте `src/content/lab/my-article.md` по образцу
[barcelona-crime-map.md](src/content/lab/barcelona-crime-map.md) (или через
админку Keystatic). Статья автоматически появится в выпадающем меню LAB, в
sitemap и получит SEO-теги. Подпись под картинкой — строка курсивом
(`*подпись*`) сразу после картинки.

## Контактная форма

Обрабатывается собственным бэкендом — `apps/server` (Astro SSR + Node),
эндпоинт `POST /api/contact` (валидация, honeypot, rate-limit, отправка письма
по SMTP). Подробности — в [apps/server/README.md](apps/server/README.md).

Поле `formEndpoint` в [site.yaml](apps/web/src/content/site.yaml):

- **Пусто (сейчас):** вместо формы показывается кнопка с email + соцсети.
- **Указан URL бэкенда** (например, `https://api.time2map.com/api/contact`):
  рендерится полная форма (Name / Email / Budget / Project description), сабмит
  уходит на эндпоинт (через fetch с graceful-фоллбэком на обычный POST).
  Финальный URL выставляется при деплое (Фаза 5).

## Деплой

Docker Compose на одном Linux-сервере: host nginx+certbot → `127.0.0.1:8080`
(контейнеры `web` + `app`). CI пушит образы в GHCR и по SSH делает
`compose pull/up`. Полный гайд — [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

Контент правится в репозитории (локально Keystatic в `npm run dev`) и выходит
в прод после мержа в `master`. URL-структура 1-в-1 с Webflow
(`/`, `/use-cases`, `/contact-us`, `/lab/<slug>`).
