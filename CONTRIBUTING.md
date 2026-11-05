# Как вносить изменения

Правила одинаковы для людей и агентов. Запуск проекта — в [`README.md`](README.md); архитектура — [`docs/architecture/layers.md`](docs/architecture/layers.md).

## Источник правды

- Продуктовые требования, сценарии, TOV, метрики и брифы фич живут в Google Drive (`Tadum/`). В репозитории — снимок `docs/product/`, его не правят руками: обновление только синхронизацией (PR `docs: sync product docs YYYY-MM-DD`).
- Документация разработки — `docs/` (русский). Код, идентификаторы, ключи i18n, имена событий и сообщения коммитов — английский.
- Расхождение кода и продуктового документа решается в Drive, затем синхронизацией — не правкой снимка.

## Ветки

- `main` меняет только владелец (Кирилл), merge-коммитом PR. Прямых push в `main` нет; force-push запрещён.
- Ветка на задачу: `<type>/<коротко>` — `feat/upload-documents`, `fix/otp-resend`, `docs/…`, `chore/…`. Фичи по брифу — `feat/TD-###-<коротко>`.
- Ветка живёт от свежего `main`; при конфликте — `git merge origin/main` в свою ветку (историю чужих веток не переписываем).

### Несколько задач параллельно — worktree

```bash
git worktree add ../tadum-otp -b fix/otp-resend origin/main
```

```bash
cd ../tadum-otp && pnpm install
```

Каждый worktree — отдельная папка со своими `node_modules`; удалить — `git worktree remove ../tadum-otp`.

## Коммиты

[Conventional Commits](https://www.conventionalcommits.org/ru/v1.0.0/), проверяет `commitlint` (хук `commit-msg` и CI):

```
type(scope): что сделано, в повелительном наклонении, по-английски
```

- `type`: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `style`, `build`, `ci`, `chore`, `revert`.
- `scope`: имя среза (`request-otp`, `cabinet-shell`, `application`, …), слой (`app`, `pages`, `widgets`, `features`, `entities`, `shared`), сегмент `shared` (`api`, `i18n`, `ui`, …) или `setup`, `docs`, `release`, `design`, `deps`, `ci`. Список собирается из папок `src/` автоматически (`commitlint.config.mjs`).
- Строки тела — не длиннее 100 символов.

Хук `pre-commit` прогоняет ESLint и Stylelint по изменённым файлам (lint-staged).

## Changesets

Изменение поведения приложения сопровождается changeset — он поднимает версию в `package.json` и пишет `CHANGELOG.md`:

```bash
pnpm exec changeset
```

Выберите тип (patch / minor / major) и опишите изменение для человека. Чистые правки документации, тестов и CI changeset не требуют (`pnpm exec changeset add --empty`, если CI попросит). Версия видна в «Помощи» и в событии `app_loaded`.

## Перед PR

```bash
pnpm verify
```

Должно быть зелёным. Если меняли экраны — дополнительно `pnpm test:e2e` и `pnpm screenshots`, посмотрите скриншоты в AR и EN, светлой и тёмной темах.

Частые причины красного `verify`:

- строка интерфейса в коде — добавьте ключ в `src/shared/i18n/locales/{ar,en}.json` (паритет обязателен) и вызовите `t()`;
- физический класс (`ml-2`, `text-left`) — используйте логический (`ms-2`, `text-start`);
- импорт мимо `index.ts` среза или «вбок» — см. `docs/architecture/layers.md`;
- сырые цвета или отступы — только токены (`src/styles/tokens.css`);
- новое событие аналитики — сначала в `docs/product/04-metrics-and-events.md` (Drive), затем в `src/shared/analytics/events.ts`;
- изменение портов — `pnpm contract:md`, закоммитить обновлённый `docs/05-backend-contract.md`.

## Pull request

- Описание — по шаблону `.github/PULL_REQUEST_TEMPLATE.md` (Definition of Done, [`docs/dod.md`](docs/dod.md)). Неприменимый пункт — «н/п» с причиной.
- Зелёный job `ci` обязателен (размер и Lighthouse в v1 только отчёт).
- Merge — **merge-коммитом** (не squash, не rebase): история веток сохраняется.
- После merge `main` автоматически выкладывается превью https://tadum.kirillgloba.workers.dev. Публикация версии на витрину Proto — отдельное действие (`pnpm release:proto vN`), только с подтверждения владельца.

## Секреты и данные

- Секреты — только в секретах репозитория GitHub (GitLab CI — в переменных проекта) и панели Cloudflare. Не в коде, не в `.env*`, не в переменных `VITE_*`. CI проверяет историю gitleaks.
- Никаких персональных данных в URL, логах, аналитике, фикстурах и скриншотах. Телефоны в фикстурах — вымышленные `+966 5000 000NN`.

## Решения

Значимое архитектурное решение — ADR в `docs/decisions/` (и копия в Drive `05 Разработка/ADR`). Допущение, принятое без владельца, — запись в `docs/decisions/assumptions.md` с тем, как его проверить.
