# Мастер-промпт: создание среды разработки Tadum в Claude Code

**Версия:** 1.3 (черновик — живой каркас) · **Дата:** 2026-11-04 · **Статус:** готов к запуску; учтены все 30 находок ревью (`05-master-prompt-review.md`, D-067…D-075); основная среда — Claude Code в веб-версии (D-076); основа дизайн-системы — пресет shadcn от Кирилла (D-077).
**Источники:** план проекта §3 (3.1–3.9), решения D-001…D-077, `00-roadmap.md` (v1), `01-*.md`, `tov-lexicon.json`, `04-metrics-and-events.md`, шаблоны брифа и DoD, код воркера Proto. **Результат выполнения:** репозиторий `tadum` в GitHub Кирилла с рабочим скелетом, дизайн-системой, моками, слоем Claude Code и опубликованной v1 на витрине Proto.

> **Как пользоваться (D-076).** Вся работа идёт в **Claude Code в веб-версии** (claude.ai/code) — так же, как настраивалась и публиковалась «Единая активация»: Кирилл открывает облачную сессию в том же окружении, где работала «Единая активация» (доступ к GitHub, Cloudflare, коннектор Google Drive), и отправляет этот документ первым сообщением вместе с **пресетом shadcn** (§0.6). Всё остальное, включая создание репозитория `tadum` на GitHub, делает агент (блок 0). Proto для блока 9 подключается так же, как это было сделано для «Единой активации».
>
> Агент выполняет блоки **строго в порядке из §0.5**. Один блок — одна итерация: перечитать раздел блока из `docs/setup/master-prompt.md` → записать план блока в `docs/setup/progress.md` (plan mode и `ExitPlanMode` не использовать, если Кирилл не попросил) → выполнить → пройти проверку из конца блока → коммит `chore(setup): <блок> — …` → push ветки → обновить `progress.md` → отчёт в 3–5 строк. Останавливаться и ждать ответа можно **только** в точках **⏸**; в остальных случаях — применить дефолт и записать допущение. Если проверка блока не проходит — чинить в том же блоке. После перерыва или сжатия контекста — начать с чтения `docs/setup/progress.md` и раздела текущего блока, а не по памяти.

---

## 0. Контекст, роли, инварианты

### 0.1 Что строим

Tadum — B2B-портал для рынка KSA: кабинет клиента (заявка на торговый лимит, документы, статус, лимит) и кабинет поставщика (статус, реферальная ссылка и QR, приведённые клиенты, документы, условия) в одной оболочке. Фронтенд без бэкенда: все данные из `MockAdapter`; позже команда разработки подключит API поверх портов и перенесёт репозиторий в GitLab. Версии прототипа публикуются на витрину Proto (`https://proto.kirillgloba.workers.dev/p/tadum/vN/`) с отдельным паролем.

### 0.2 Документы и папки Drive

Источник правды — Google Drive `Tadum/` (русский, Markdown). В блоке 1b агент кладёт **дословный** снимок в `docs/product/`; до этого читает документы через коннектор Google Drive. ID могут устареть: надёжнее искать по имени внутри папки (`parentId`-запросом), чем доверять ID; найденные ID записать в `docs/product/README.md`.

| Документ | Drive ID | Что брать |
|---|---|---|
| План проекта Tadum.md | ищется по имени в папке `00` | §3 целиком — обоснования решений этого промпта |
| Журнал решений.md | ищется по имени в папке `00` | D-001…D-075 — при любом сомнении искать здесь |
| 00-roadmap.md | ищется по имени в папке `00` | состав v1 и критерии готовности |
| 01-roles.md | `1JrpXr6UVuqPt7t85lXSeiOnID03GA_4T` | `resolveRoles`, матрицы прав, «что не показываем» |
| 01-cabinet-structure.md | `1uEjQ7I_gJt30biisfqqDE5ucT-KeMvUN` | маршруты и `screen_id`, оболочка (§2 — черновик), шкала, карточка шага |
| 01-entities.md | `1xZavpWQsvcmYFBK1utr423NIxh_64W1d` | YAML сущностей → типы и Zod; персоны |
| 01-statuses.md | `1s3nhsFgvXYpRRtNmtG18AwowmsdUk7LG` | маппинг стадий, машины состояний, мок-действия §10 |
| 01-nfr-locale-brand.md | ищется по имени в папке `01` | локаль, форматтеры, NFR, токены, TOV |
| tov-lexicon.json | `1W2G4zoLEu8kqJkmeGs3gZoK98GNXo1r7` | копируется в репозиторий побайтно |
| 04-metrics-and-events.md | `1GbdRrWcAa_vqZi20FHLMACGHKIDtATKF` | словарь событий → `events.ts` |
| Сценарии SC-01…SC-10, SP-01…SP-05 | папка `1aZic7MiF3mXDjwlP8ii4bBpD-D5aSRcX` | для v1: SC-01, SC-05, SC-10, SP-01 (часть) |
| Шаблон брифа фичи (Claude Code).md | `1evxCl6LwyKliUFmp_4GRwG4FUj9ioLLp` | → `docs/templates/feature-brief.md` |
| Definition of Done для PR.md | `1Khr1JkbcTTGnmzJw9fGlQmx3r-noZi8X` | → `.github/PULL_REQUEST_TEMPLATE.md` |
| Требования к кабинету — клиент / поставщик | `1RhWLbD8PIPTYq5HcjOaSifV9JgLN2128` / `1m7p6aNOBqaZYZ7DDkHhjc6hMRziYxJAi` | исходные требования, только для контекста |

| Папка Drive | ID | Что туда кладёт агент |
|---|---|---|
| `Tadum/` (корень) | `12ocVUApnD-KvXbsLA-f9-PWJ7EKC-1-E` | — |
| `00 Управление проектом` | `1K8PD3IAS4w6yGxGIzWPKXRWNIyI2lQ9V` | — |
| `01 Требования к продукту` | `1tN-xzFloaCDJ673K0l5DAKID5h_EgG3d` | — |
| `02 Дизайн-система и бренд` | `1i2RYOPmbJdlBjhoGxBFA0YH35D9xVzfL` | `02-design-system.md` — пресет и токены Tadum (блок 4a) |
| `04 Аналитика и метрики` | `1nM7hJ8imM9AU9RnSza1nsmNF9ClICs-y` | — |
| `05 Разработка` | `19icVaCN1pyAZs5MeDuNv9N8ahrzgOu6w` | `05-claude-code-environment.md`, `05-backend-contract.md`, `05-migration-to-gitlab.md` (блоки 7b, 8b) |
| `05 Разработка/Фичи` | `1avpWsSHxsypPO5w0qL0gyue7P5ZNGtZr` | брифы `TD-###` (скилл `/feature-brief`) |
| `05 Разработка/ADR` | `1V4wbfmUgvKfdf9K4gDU1Bbk8BFeYX-Yw` | ADR-001…003 уже лежат; новые ADR |
| `06 Версии прототипа` | `1jaJlwTatckcrnzIE-qZBLDSDhWDejDFT` | `v1.md` (блок 9) |

**Как писать в Drive.** Коннектор не умеет менять содержимое файла: новая версия = новый файл + старый в корзину. Загрузку больших файлов делать отдельным субагентом: он читает файл с диска, загружает, сверяет `fileSize` с `wc -c` и не печатает содержимое в ответ.

### 0.3 Инварианты (нарушать нельзя ни в одном блоке)

1. **Арабский по умолчанию, RTL и LTR равноправны** (D-005, D-006, `01-nfr-locale-brand.md` §1). Любой экран существует в AR и EN, в светлой и тёмной теме.
2. **Ни одной пользовательской строки в коде** — только ключи i18n с паритетом `ar`/`en`; тексты проверяются `tov-lexicon.json`.
3. **Данные только через порты** `shared/api/ports/*`; компоненты не знают про мок.
4. **Только токены**: сырые hex/px/мс в компонентах запрещены; `src/styles/tokens.css` и `src/shared/ui/**` после блока 8b меняются только через субагента `design-system-owner` (хук).
5. **Нет PII** в URL, хранилище вне сессии, аналитике, логах (`04-metrics-and-events.md` §2.3).
6. **Языки артефактов (D-014, D-062):** код, идентификаторы, имена файлов, коммиты, ключи i18n, имена событий — английский; `CLAUDE.md`, `.claude/**` (правила, агенты, скиллы, сообщения хуков), комментарии в коде, `README.md`, `CONTRIBUTING.md`, `docs/**`, release notes, ADR — русский.
7. **`docs/product/**` — снимок Drive**: правится только скиллом `/sync-product-docs`, никогда вручную.
8. **Перед остановкой — `pnpm verify` зелёный** в том составе, который определён к текущему блоку (§1.6).
9. **Секреты ставит только Кирилл** (D-068): агент никогда не выполняет `wrangler secret …`, `gh secret …`, не видит и не записывает пароли и токены — только говорит, где и что поставить (дашборд Cloudflare, настройки репозитория GitHub, настройки окружения облачной сессии), и ждёт подтверждения.
10. **Общие ресурсы — только после ⏸** (D-069): push в `main` Proto, деплой Proto, первый деплой превью-воркера, merge в `main` Tadum — только после явного «да» Кирилла, с показанным diff.
11. **Не угадывать.** Если документ не отвечает на вопрос — взять значение из колонки «По умолчанию» раздела «Открытые вопросы» соответствующего `01-*.md`/сценария; если его нет — записать допущение в `docs/decisions/assumptions.md` (что, почему, как проверить) и продолжить. Ждать Кирилла — только в точках ⏸.
12. **Проверять, а не доверять.** Флаги CLI, ключи конфигов, схемы хуков и API библиотек в этом документе — ориентир на ноябрь 2026. Перед использованием — `--help` команды и Context7; при расхождении действует фактическое поведение, отклонение — в `assumptions.md`.

### 0.4 Среда исполнения (проверить в блоке 0)

- Node 22 LTS, pnpm 10, git ≥ 2.45, `jq`, `gh`, `wrangler` (ставится как dev-зависимость), Graphviz `dot` (необязательно — без него граф зависимостей в Mermaid). В облачной сессии Claude Code всё, кроме `wrangler` и `dot`, уже установлено.
- Владелец GitHub — из `git remote -v`; Cloudflare `account_id` — из `wrangler whoami` (если аккаунтов несколько — ⏸ спросить, какой). Доступ к Cloudflare — как в окружении «Единой активации»: если `wrangler whoami` не проходит, ⏸ сообщить Кириллу, что именно не работает (сеть, токен), и продолжать блоки, где Cloudflare не нужен.
- Proto (`$PROTO_DIR` — путь к его клону в облачной сессии): нужен только в блоке 9; найти тем же способом, каким Proto был подключён для «Единой активации». До блока 9 не требуется.
- Конфигурация сессий (какие репозитории подключены, где работают хуки, как подключается Proto) — как при настройке «Единой активации». Хуки `tadum` создаются в блоке 8b и проверяются там же; если в текущей сессии они не срабатывают, агент пишет, в какой конфигурации сессии их нужно проверить, и продолжает.
- Коннекторы и MCP: Google Drive и Mobbin — коннекторы claude.ai (уже подключены у Кирилла, в `.mcp.json` не объявляются); Context7, shadcn, Playwright, GitHub, Cloudflare — объявляются в `.mcp.json` в блоке 8b, до этого используются, если уже доступны. Отсутствующий — продолжить без него и записать в `progress.md`.
- Долгоживущие процессы (`pnpm dev`, `storybook dev`) в проверках не запускать на переднем плане: только в фоне с таймаутом и `curl`, затем остановить; для Storybook проверять `storybook build`.
- Все версии пакетов фиксируются точными номерами (`save-exact=true`); мажоры из §1.2 не превышать без ADR.

### 0.5 Порядок блоков

| Блок | Содержание | Ветка |
|---|---|---|
| 0 | Подготовка: сохранить промпт, `progress.md`, проверка среды | `chore/setup` |
| 1 | Репозиторий, Vite-проект вручную, базовый путь, Wrangler, `verify` v1 | `chore/setup` |
| 1b | Снимок Drive → `docs/product/` (побайтно) | `chore/setup` |
| 2 | Слои, алиасы, границы | `chore/setup` |
| 3 | i18n, форматтеры, лексикон-lint | `chore/setup` |
| 4a | shadcn по пресету Кирилла, токены Tadum, шрифты, тема, Storybook | `chore/setup` |
| 5a | Типы, Zod, чистые функции + тесты | `chore/setup` |
| 5b | Порты, `MockAdapter`, персоны, демо-действия, часы | `chore/setup` |
| 5c | Аналитика, `HttpAdapter`-каркас, контракт | `chore/setup` |
| 6a | Маршруты, гарды, вход (SC-01) | `chore/setup` |
| 6b | Оболочка, настройки, служебные экраны | `chore/setup` |
| 6c | Главная клиента, баннер статуса, демо-панель | `chore/setup` |
| 6d | Playwright, axe, скриншоты | `chore/setup` |
| 7a | Скрипты, husky, commitlint, changesets, CI ×2, защита `main` | `chore/setup` → ⏸ merge |
| 7b | Документация разработки, DoD, контракт, GitLab-чек-лист | `chore/setup-2` |
| 8a | `CLAUDE.md`, правила, агенты, скиллы | `chore/setup-2` |
| 8b | Хуки, permissions, `.mcp.json`, плагины — **последним** | `chore/setup-2` → ⏸ merge |
| 9 | ⏸ Публикация v1 на витрину Proto (отдельная сессия с доступом к Proto) | `chore/release-v1` |
| 10 | Критерии приёмки и итоговый отчёт | — |

### 0.6 Входные данные от Кирилла

| Что | Когда нужно | Если нет |
|---|---|---|
| **Пресет shadcn** (D-077) — то, что выдаёт конструктор тем shadcn после настройки: команда, ссылка или код пресета с базовой темизацией и системой токенов (палитра светлой и тёмной темы, радиусы, шрифт, стиль компонентов) | блок 4a | ⏸ в начале блока 4a; блоки 0–3 можно выполнять без него |
| Доступ к Cloudflare в окружении сессии | блоки 1 (`--dry-run`), 7a, 9 | см. §0.4 |
| Пароль Tadum для витрины | блок 9 | ⏸ (Кирилл ставит сам, D-068) |

**Модель веток (D-070).** Блоки до 7a включительно — коммит на блок в ветку `chore/setup`, push после каждого блока. В конце 7a — PR `chore/setup → main`; **⏸ мёржит Кирилл, merge-коммитом (не squash)**, чтобы коммиты блоков остались в истории. Блоки 7b–8b — ветка `chore/setup-2` от свежего `main`, PR так же. Блок 9 — ветка `chore/release-v1`.

---

## Блок 0 — подготовка

1. **Создать репозиторий** тем же способом, каким создавался репозиторий «Единой активации»: `gh repo create tadum --private --description "Tadum — client & supplier portal (KSA). Frontend prototype, mock data." --add-readme` (флаги сверить с `gh repo create --help`), склонировать его в рабочий каталог сессии и работать в нём. Если репозиторий `tadum` уже существует — не пересоздавать, использовать его. Если создать не удаётся (нет прав у токена сессии) — ⏸ сообщить Кириллу точную ошибку и что нужно разрешить.
2. Сохранить **этот документ дословно** в `docs/setup/master-prompt.md` (если Кирилл передал файл — скопировать файл; если текст — записать без изменений и сверить, что заголовки §0–§10 на месте).
3. Создать `docs/setup/progress.md`: таблица «блок · статус (todo/in-progress/done/blocked) · коммит · заметки», строки из §0.5; раздел «Допущения» со ссылкой на `docs/decisions/assumptions.md`; раздел «⏸ ожидают Кирилла».
4. Проверить среду §0.4, результаты записать в `progress.md`.
5. Коммит в `main` `chore(setup): block 0 — master prompt and progress`, push (пустой новый репозиторий — до включения защиты `main`).

**Проверка блока 0:** `gh repo view tadum` показывает приватный репозиторий Кирилла; `docs/setup/master-prompt.md` совпадает с переданным текстом (`diff` пуст или различия только в переводах строк); `progress.md` содержит все блоки из §0.5; доступ к Cloudflare проверен и записан.

---

## Блок 1 — инициализация репозитория

**Цель:** собирающийся проект с базовым путём, Wrangler и `verify` первого уровня в репозитории `tadum`.

### 1.1 Репозиторий

Репозиторий создан в блоке 0, `origin` настроен: `git switch -c chore/setup`.

Файлы: `.nvmrc` (22), `.npmrc` (`save-exact=true`, `engine-strict=true`), `package.json` (`"packageManager": "pnpm@10.x.y"`, `"type": "module"`, `"pnpm": { "onlyBuiltDependencies": ["esbuild", "@tailwindcss/oxide", "workerd", "sharp"] }` — список уточнить по предупреждению `pnpm install`; интерактивный `pnpm approve-builds` не запускать), `.editorconfig`, `.gitignore` (node, `dist`, `.wrangler`, `playwright-report`, `test-results`, `storybook-static`, `tests/screenshots`, `.env*.local`), `README.md` (русский: что это, как запустить, ссылки на Drive и витрину), `docs/product/README.md` (таблицы §0.2, пометка «снимок, не редактировать»).

### 1.2 Стек и мажоры (D-003)

Vite-проект создаётся **вручную**, без шаблонов (`create vite`, `create cloudflare`, `shadcn init -t vite` тянут другие мажоры и интерактивны).

| Пакет | Мажор | Примечание |
|---|---|---|
| `vite` | 7 | `vite@^7`; не 8 без ADR |
| `@vitejs/plugin-react` | совместимый с Vite 7 | |
| `react`, `react-dom` | 19 | |
| `typescript` | 5 (`~5.9`) | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` |
| `@tanstack/react-router`, `@tanstack/router-plugin` | 1 | файловые маршруты (§2) |
| `@tanstack/react-query` | 5 | единственный слой данных |
| `tailwindcss`, `@tailwindcss/vite` | 4 | конфиг в CSS |
| `i18next`, `react-i18next` | текущие | без `i18next-browser-languagedetector` (своё определение, §3) |
| `vite-plugin-pwa` | 1 | §1.3 |
| `zod` | 4 (D-065) | |
| `lucide-react` | текущий | |
| `qrcode` | текущий | ленивый чанк, используется с v3 |
| `wrangler` | 4 | |
| `eslint`, `vitest`, `@playwright/test`, `storybook` и аддоны | по матрице совместимости на дату | выбрать связку, в которой Storybook 10 + Vitest-аддон и все `eslint-plugin-*` поддерживают выбранный мажор ESLint; записать в ADR-001 |

Перед установкой каждой библиотеки — Context7 на актуальный способ подключения. Точные версии — в `docs/decisions/ADR-001-stack.md` (приложение «Версии на дату инициализации»; текст ADR — приложение A). Зависимости, которые понадобятся только в следующих версиях (`qrcode`), ставить в том блоке, где они впервые используются, — иначе `knip` будет ругаться.

### 1.3 Базовый путь, окружения, PWA

```ts
// vite.config.ts (фрагмент)
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE_PATH || '/';          // '/' в dev-сервере и в проде, '/p/tadum/vN/' на витрине
  return {
    base,
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    plugins: [
      tanstackRouter({
        target: 'react', autoCodeSplitting: true,
        routesDirectory: './src/pages',
        generatedRouteTree: './src/app/routeTree.gen.ts',
        routeFileIgnorePattern: '^index\\.ts$|\\.test\\.|\\.stories\\.',
      }),
      react(), tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate', base, scope: base, useCredentials: true,
        manifest: { name: 'Tadum', short_name: 'Tadum', lang: 'ar', dir: 'rtl', display: 'standalone', start_url: base, scope: base, /* icons, theme_color */ },
        workbox: { navigateFallback: `${base}index.html` },
      }),
    ],
  };
});
// src/app/router.tsx
const router = createRouter({ routeTree, basepath: import.meta.env.BASE_URL.replace(/\/$/, '') || undefined, defaultPreload: 'intent' });
```

Имена опций плагинов сверить через Context7 (`@tanstack/router-plugin`, `vite-plugin-pwa`). `useCredentials: true` обязателен: на витрине манифест лежит за парольным шлюзом Proto и без cookie вернётся HTML шлюза (проверка в блоке 9). Иконки PWA — простой плейсхолдер из `Wordmark` (192/512, `any` + `maskable`); полноценная установка — v5.

`.env.example` (с комментариями на русском):

| Переменная | Значения | Назначение |
|---|---|---|
| `VITE_BASE_PATH` | `/`, `/p/tadum/v1/` | базовый путь сборки |
| `VITE_API_MODE` | `mock` \| `http` | адаптер портов; `http` собирается, методы бросают `NotImplementedError` |
| `VITE_DEMO_PANEL` | `1` \| `0` | демо-панель и `?persona=`; витрина `1`, прод `0` |
| `VITE_ANALYTICS` | `console` \| `demo` \| `posthog` | провайдер (D-011, D-059); витрина — `demo` |
| `VITE_PROTO_VERSION` | `vN` | подпись версии на витрине |
| `VITE_SUPPORT_WHATSAPP`, `VITE_SUPPORT_EMAIL` | `966579768881`, `info@tadum.sa` | SupportBar |
| `VITE_LANDING_URL` | `https://tadum.sa` | «Подать заявку» для `unknown` |

### 1.4 Wrangler и превью-воркер (D-063)

`wrangler.jsonc`: `name: "tadum"`, `account_id` из `wrangler whoami`, `compatibility_date` = дата инициализации, `assets: { directory: "./dist", not_found_handling: "single-page-application" }` (ключи сверить с документацией Cloudflare через Context7), без Worker-скрипта. `public/_headers`: `X-Robots-Tag: noindex` — только для превью; при копировании на витрину `_headers` исключается (блок 9). Скрипт `deploy:preview` = `pnpm build && wrangler deploy`. Сейчас — только `wrangler deploy --dry-run`; реальный первый деплой — в конце блока 7a после ⏸.

### 1.5 Хранилище браузера (D-072)

С первого кода — `src/shared/lib/storage.ts`: все ключи `localStorage`/`sessionStorage` только через него, с префиксом `tadum:${import.meta.env.BASE_URL}:` (версии на одном домене витрины не видят друг друга), обёртка в `try/catch` (недоступное хранилище → память + событие `storage_unavailable` после блока 5c). Прямой `localStorage` вне этого файла запрещён lint-правилом в блоке 2.

### 1.6 `pnpm verify` — наращивается по блокам

Скрипт `verify` создаётся сейчас и дополняется в конце каждого блока; инвариант 8 относится к составу на текущий блок.

| После блока | Состав `verify` |
|---|---|
| 1 | `typecheck && build` |
| 2 | `+ lint && deps:check` |
| 3 | `+ lint:i18n && test` |
| 4a | `+ storybook:build` |
| 5c | `+ check:events` |
| 6d | `+ test:e2e:smoke` (один проект, без скриншотов) |
| 7a | `+ knip && jscpd && lint:gitlab-ci` |

**Проверка блока 1:** `pnpm install` без интерактивных вопросов; `pnpm verify` зелёный; `pnpm build` даёт `dist/index.html` с `<html lang="ar" dir="rtl">`; `VITE_BASE_PATH=/p/tadum/v1/ pnpm build` — все ассеты в `dist/index.html` начинаются с `/p/tadum/v1/`; `pnpm wrangler deploy --dry-run` проходит; `git remote -v` — `origin` на `tadum` Кирилла, ветка `chore/setup` запушена. Если `--dry-run` не проходит из-за доступа к Cloudflare — отметить ⏸ и продолжать (обязателен к блоку 7a).

---

## Блок 1b — снимок Drive в `docs/product/`

**Цель:** дословная копия продуктовых документов в репозитории **до** проверок, которые их читают (D-064).

1. Для каждого документа §0.2 (и всех файлов папки «Сценарии») — отдельный субагент: скачать содержимое коннектором Google Drive (`download_file_content` или аналог), записать в `docs/product/<имя>.md` (или `.json`) **без пересказа и правок**, добавить первой строкой `<!-- source: Drive <id>, synced: <дата>. Не редактировать — источник в Drive. -->` (для JSON — без шапки, источник в `docs/product/README.md`), сверить размер тела с `fileSize` Drive, содержимое в ответ не печатать.
2. `tov-lexicon.json` — дополнительно копия в корень репозитория; проверка `JSON.parse` и совпадения `version`.
3. `docs/product/README.md` — таблица «файл · Drive ID · дата синхронизации».
4. Шаблоны: `docs/templates/feature-brief.md` (из брифа), `.github/PULL_REQUEST_TEMPLATE.md` и `docs/dod.md` (из DoD) — с той же шапкой источника.

**Проверка блока 1b:** все файлы на месте, размеры совпадают с Drive; `node -e 'JSON.parse(require("fs").readFileSync("tov-lexicon.json"))'` проходит; в `docs/product/` нет файлов без шапки (кроме JSON).

---

## Блок 2 — структура слоёв и границы

**Цель:** FSD-lite с машинной проверкой границ (план §3.1).

```
src/
  app/            providers.tsx, router.tsx, routeTree.gen.ts (генерируется, коммитится), i18n.ts, theme.tsx, pwa.ts, analytics.ts, main.tsx
  pages/          файловые маршруты TanStack (см. ниже); index.ts здесь НЕТ
  widgets/        status-timeline/, next-step-card/, cabinet-shell/, support-bar/, demo-panel/, language-switch/, role-switch/, theme-switch/
  features/       request-otp/, verify-otp/, logout/, switch-role/, switch-language/, switch-theme/
  entities/       session/, application/, document/, limit/, supplier/, referred-client/, offer/
  shared/
    ui/           компоненты shadcn (CLI, блок 4a) + ltr.tsx, icon/, wordmark.tsx, status-badge.tsx
    api/          ports/, adapters/mock/, adapters/http/, fixtures/personas/, client.ts
    i18n/         locales/ar.json, locales/en.json, format.ts, config.ts, types.d.ts
    analytics/    events.ts, track.ts, context.ts, buckets.ts, providers/, pii-guard.ts
    config/       env.ts (zod-валидация import.meta.env), routes.ts (ScreenId), features.ts (offer=false), timings.ts
    lib/          env/ (isInAppBrowser, isStandalone), storage.ts, clock.ts, utils.ts
  styles/         tokens.css, fonts.css, globals.css
content/          offer.ar.json, offer.en.json (D-041; пустые заготовки)
scripts/          hooks/, release-proto.mjs, lint-i18n-tov.mjs, check-events.mjs, contract-md.mjs, gen-fixtures.ts
```

Маршруты в `src/pages/` (TanStack file-based): `__root.tsx`, `index.tsx`, `login/index.tsx`, `login/code.tsx`, `not-found.tsx`, `session-expired.tsx`, `c/home.tsx`, `c/documents.tsx`, `c/help.tsx`, `s/home.tsx`, `s/help.tsx`, `$.tsx`. Состав — §6a (D-067).

Правила:

- Каждый срез `widgets/features/entities/shared/*` экспортирует только `index.ts`; импорт внутрь среза извне запрещён. В `pages/` `index.ts` нет — публичный API слоя это сами маршруты.
- Направление импортов: `app → pages → widgets → features → entities → shared`; обратные и горизонтальные (между срезами одного слоя, кроме `shared`) запрещены. `app/routeTree.gen.ts` относится к слою `app`.
- `shared/ui` не импортирует `entities`/`features`; `track()` не вызывается из `shared/ui`.
- `odoo_stage` не импортируется в `widgets/` и `pages/` (`01-roles.md` §6).
- Прямые `localStorage`/`sessionStorage` вне `shared/lib/storage.ts` и `new Date()`/`Date.now()` вне `shared/lib/clock.ts` — запрещены (`no-restricted-globals`/`no-restricted-syntax`).

Инструменты: `eslint-plugin-boundaries`, `dependency-cruiser` (циклы, слои; `pnpm deps:graph` → `docs/architecture/deps.svg`, если есть `dot`, иначе `deps.mmd` через `--output-type mermaid`), `knip` (подключается в `verify` с блока 7a), `jscpd` (порог 3 %), `tsc --noEmit`.

**Проверка блока 2:** срезы созданы с `index.ts` (кроме `pages/`); генератор маршрутов создаёт `src/app/routeTree.gen.ts` без лишних маршрутов; на **временной ветке** `test/guards`: импорт `features → pages` и прямой `localStorage.getItem` валят `pnpm lint` — затем `git switch chore/setup && git branch -D test/guards`; `pnpm verify` (состав блока 2) зелёный; `docs/architecture/layers.md` (русский) описывает слои и правила.

---

## Блок 3 — i18n, форматирование, локаль

**Цель:** всё из `01-nfr-locale-brand.md` §1 работает до появления экранов.

1. `shared/i18n/config.ts`: `supportedLngs: ['ar','en']`, `fallbackLng: 'ar'`, определение `?lang=` → `storage('lang')` → `ar` (браузерный язык не используется); `interpolation: { prefix: '{', suffix: '}', escapeValue: false }` (D-075 — в сценариях и документах плейсхолдеры `{count}`); при смене языка — `document.documentElement.lang/dir` и вызов `track('language_changed', …)` через временный `shared/analytics/track.ts` (no-op с типом; реальная реализация — блок 5c).
2. `shared/i18n/types.d.ts`: типизация ключей по `ar.json` (`CustomTypeOptions`).
3. `shared/i18n/format.ts` (D-071). `Intl` даёт не те строки, что требует §1.3 (проверено в Node 22; `<RLM>` — невидимый символ U+200F: `<RLM>150,000 ر.س.<RLM>` с RLM и точкой, `04<RLM>/11<RLM>/2026` с RLM, `en-US` → `11/04/2026`, `قبل 3 أيام`, `28٪`). Поэтому:
   - `Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })` — только для числа (западные цифры и запятая в обоих языках);
   - `formatMoney`: AR → `${n}<NBSP>ر.س`, EN → `SAR<NBSP>${n}` (`<NBSP>` — неразрывный пробел U+00A0);
   - `formatDate`: `DD/MM/YYYY` из `Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', day:'2-digit', month:'2-digit', year:'numeric' }).formatToParts` (D-053);
   - `formatDateLong`: число + название месяца из `Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn' | 'en-GB', { month: 'long', timeZone: 'Asia/Riyadh' })` + год;
   - `formatTime`: `HH:mm`, `Asia/Riyadh`;
   - `formatRelative`: ключи i18n `relative.minutes_ago/hours_ago/days_ago` с формами множественного числа (AR — префикс `منذ`); после 7 дней — `formatDate`;
   - `formatPercent`: AR → `${n}<NBSP>%`, EN → `${n}%` (`<NBSP>` — неразрывный пробел U+00A0);
   - `formatFileSize`: число + ключ `units.mb` / `units.kb` (AR `ميجابايت` / `كيلوبايت`);
   - `formatPhone` / `maskPhone` — по §1.3;
   - из любого результата удаляются невидимые символы направления `U+200E` (LRM) и `U+200F` (RLM).
   Unit-тесты сравнивают **побайтно** со всеми примерами таблицы §1.3 и с вариантами выше.
4. `shared/ui/ltr.tsx` — `<bdi dir="ltr">`; `shared/ui/icon/` — обёртка над lucide со списком `mirroredIcons` (§1.2).
5. ESLint: `no-restricted-syntax` на `toLocaleString`, `Intl.` и `toLocale*` вне `shared/i18n`; `i18next/no-literal-string` для JSX; `eslint-plugin-rtl-friendly`.
6. Извлечение и проверка ключей: сначала Context7 — актуален ли `i18next-parser` или его заменил `i18next-cli`; взять актуальный, настроить на синтаксис `{…}` и формы `zero one two few many other` для `ar`. Скрипт `pnpm lint:i18n` = извлечение (флаг «ошибка при предупреждениях» — в командной строке) + паритет ключей + `scripts/lint-i18n-tov.mjs` по полям `forbidden`, `exceptions`, `length_limits`, `lint.also_check` из `tov-lexicon.json`.
7. Стартовые ключи: `common.*` (offline, retry, cached_at, server_error_retry, open_in_browser, copy_link), `lang.*`, `theme.*`, `nav.*`, `support.*`, `relative.*`, `units.*` — AR/EN из SC-10 и `01-cabinet-structure.md` §3.
8. **Множественное число.** В сценариях у ключей с `{count}` дана одна форма. Недостающие арабские формы (`_zero _one _two _few _many _other`) пишет субагент `ux-writer` (до блока 8a — сам агент по тем же правилам `01-nfr-locale-brand.md` §3.5); каждый такой ключ — строка в `docs/i18n/needs-review.md` (ключ, какие формы дописаны) для проверки носителем. Это не блокирует ни один блок.

**Проверка блока 3:** unit-тесты `format.ts` зелёные (включая `150,000 ر.س`, `SAR 150,000`, `04/11/2026` в обоих языках, `+966 50 123 4567`, `منذ 3 أيام`, `28 %`); на временной ветке `test/guards`: `"credit"` в `en.json` валит `pnpm lint:i18n` с кодом `credit_loan`, ключ только в `en.json` валит паритет — ветку удалить; `pnpm verify` (состав блока 3) зелёный.

---

## Блок 4a — пресет shadcn, токены Tadum, шрифты, тема, Storybook

**Цель:** дизайн-система на основе **пресета shadcn, который задал Кирилл** (D-077): пресет — полноценная основа темизации и токенов; агент его применяет, а не выбирает и не придумывает. Нет пресета — ⏸ в начале блока.

### 4a.1 shadcn

1. `pnpm dlx shadcn@latest init --help` и Context7 `/shadcn-ui/ui`: выяснить, как применить пресет из конструктора к **существующему** проекту (флаг/аргумент пресета), как выбрать примитивы Radix и включить RTL. Шаблон проекта (`-t`) **не** использовать — проект уже есть.
2. Применить пресет Кирилла неинтерактивно (`-y`/`--defaults` по `--help`) тем способом, который даёт конструктор. Требования, которые пресет не отменяет: примитивы Radix (D-003), `rtl: true`. Если пресет требует другого (например, Base UI) — ⏸ показать Кириллу расхождение, не менять пресет самостоятельно.
3. Проверить и поправить `components.json`: `"rtl": true`, стиль на Radix, `aliases.ui = "@/shared/ui"`, `aliases.components = "@/shared/ui"`, `aliases.utils = "@/shared/lib/utils"`, `aliases.lib = "@/shared/lib"`, `tailwind.css = "src/styles/globals.css"`. CSS-переменные, которые CLI записал, перенести в `src/styles/tokens.css`; `globals.css` импортирует `tokens.css` и `fonts.css`.
4. `pnpm dlx shadcn@latest add button input input-otp card badge progress tabs sheet dialog dropdown-menu sonner skeleton alert accordion table toggle-group popover separator tooltip` — проверить, что классы логические (`ms-/me-/start-/end-`), а компоненты легли в `src/shared/ui`. Порталы получают `dir` через `DirectionProvider` в `app/providers.tsx`.

### 4a.2 Токены, шрифты, тема

- `src/styles/tokens.css` — токены **из пресета без изменений** (палитра `:root` и `.dark`, радиусы, прочее, что задаёт пресет) плюс семантические токены Tadum `01-nfr-locale-brand.md` §3.3, которых в shadcn нет: `--status-{pending,received,rejected,approved}` (+`-foreground`, `-muted`), `--limit-track`, `--limit-fill`, `--motion-*` (и `prefers-reduced-motion`). Значения семантических токенов выводятся из палитры пресета (например, `--limit-fill` = `--primary`; статусы — из оттенков пресета или нейтральные успех/внимание/ошибка в той же гамме), контраст AA в обеих темах проверяется скриптом. Как каждый семантический токен выведен — таблица в `docs/design/02-design-system.md`.
- Шрифты: арабский — всегда IBM Plex Sans Arabic (D-004). Латинский — из пресета; если пресет задаёт не Geist — использовать шрифт пресета и записать это в `assumptions.md` как уточнение D-004. Если Geist — `src/styles/fonts.css` по сниппету §3.2 с **фактическими** именами семейств пакетов: посмотреть `node_modules/@fontsource-variable/geist/index.css` (ожидается `"Geist Variable"`) и `@fontsource/ibm-plex-sans-arabic` (400/500/600/700). Итог: `:root { --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif }`, `:lang(ar) { --font-sans: "IBM Plex Sans Arabic", "Geist Variable", ui-sans-serif, system-ui, sans-serif; --leading-body: 1.625 }`. Отклонение от имени `"Geist"` в §3.2 — строка в `assumptions.md`.
- Тема: `app/theme.tsx` — `system | light | dark`, хранение через `storage('theme')`, по умолчанию `system` (D-025), класс `.dark` на `<html>`, `<meta name="theme-color" media=…>` для обеих тем.
- Запрет сырых значений: ESLint (`no-restricted-syntax` по строковым литералам `className` с `#`, `rgb(`, `\d+px`, `\[` произвольных значений Tailwind, и по `style={{…}}` с цветами/px). Stylelint — только для CSS-файлов: `at-rule-no-unknown` с `ignoreAtRules: ['theme','custom-variant','apply','utility','variant','source','plugin','config','reference','layer','import']`; сырые цвета разрешены только в `tokens.css`.

### 4a.3 Проектные примитивы

`Ltr`, `Icon`, `Wordmark` (текстовый знак «Tadum», D-052), `StatusBadge` (4 статуса документов + 6 статусов `supplier_view`, различимы иконкой и текстом).

### 4a.4 Storybook 10

Vite-builder; глобалы тулбара `locale (ar|en)` → `i18n.language`, `dir`, `lang`; `theme (light|dark)`; аддоны a11y, viewport (360/768/1280), Vitest-аддон — тесты историй запускаются через Vitest-проект аддона (`vitest --project=storybook` или как указано в документации актуальной версии; команды `storybook test` нет); декоратор с `DirectionProvider` и провайдерами. У каждого компонента `shared/ui` и `widgets` — истории всех состояний.

### 4a.5 Фиксация

`docs/design/02-design-system.md` (русский): пресет (как передан Кириллом — команда/ссылка/код), что он задал, какие токены Tadum добавлены и как выведены, результат проверки контраста; скриншоты экрана входа и карточек в AR/EN × light/dark — после блока 6d. Копия в Drive `02 Дизайн-система и бренд`. Изменение пресета позже — новый пресет от Кирилла и коммит `design: apply preset …` через `design-system-owner`.

**Проверка блока 4a:** токены пресета в `tokens.css` совпадают с тем, что выдаёт пресет (сравнить с выводом CLI); скрипт контраста AA зелёный для светлой и тёмной темы; `pnpm storybook:build` собирается, `storybook-static/index.json` содержит истории `shared/ui`; тест истории проверяет: в `locale=ar` кнопка со стрелкой зеркалится, иконка часов — нет; `document.fonts.check('16px "IBM Plex Sans Arabic"')` и `document.fonts.check('16px "Geist Variable"')` — `true` в Vitest-браузере; на временной ветке `className="ml-4"` и `style={{color:'#333'}}` валят `pnpm lint` (ветку удалить); `pnpm verify` (состав 4a) зелёный.

---

## Блок 5a — типы, схемы, чистые функции

Из `01-entities.md` §2 — `entities/*/model/types.ts` и Zod-схемы `shared/api/ports/schemas.ts` один к одному (имена полей не менять). Перечисления из `01-statuses.md`: `ClientStatus`, `SupplierViewStatus`, `SupplierStatus`, `PermissionState`, `DocumentSetStatus`, `DocumentStatus`, `LimitStatus`, `ChecklistStatus`, `OdooStage`. Чистые функции: `mapOdooStage()`, `deriveClientStatus()`, `deriveSupplierStatus(documentSet)` (SP-03 §7), `resolveRoles(phone)` (`01-roles.md` §2), `computeTimeline()` (`01-cabinet-structure.md` §5), `nextStep()` (§6), `permissions.ts` клиента и поставщика (`01-roles.md` §4–5, включая `create_reapplication`).

**Проверка блока 5a:** unit-тесты покрывают **каждую строку** таблиц маппинга и переходов (тест генерируется из таблицы-массива, а не руками по выборке); `pnpm verify` зелёный.

---

## Блок 5b — порты, `MockAdapter`, персоны, демо-действия

### 5b.1 Порты

`shared/api/ports/`: `AuthPort` (`requestOtp`, `verifyOtp`, `getSession`, `logout`), `ApplicationPort` (`getCurrent`, `createApplication` — только из `closed`, D-038), `DocumentsPort` (`getSet(owner)`, `upload`, `replace`, `delete`, `submit`, `download`), `LimitPort` (`get`, `getChecklist`), `SupplierPort` (`get`, `getCounters`), `ReferredClientsPort` (`list({statuses, sort, cursor})` — только проекция `ReferredClient`), `OfferPort` (`get` — из `content/offer.*.json`). Все ответы валидируются Zod; ошибки типизированы (`NetworkError`, `ServerError`, `NotFound`, `Forbidden`, `NotImplementedError`). `shared/api/client.ts` выбирает адаптер по `VITE_API_MODE`; `MockAdapter` и фикстуры подключаются **динамическим `import()`** — не в первом чанке.

### 5b.2 Персоны и часы (D-073)

- 14 персон из `01-entities.md` §6 — **рукописные TS-объекты** в `shared/api/fixtures/personas/*.ts`, каждая — полный граф. `@faker-js/faker` допустим только в `scripts/gen-fixtures.ts` (dev-зависимость; результат генерации коммитится), в `src/` его нет.
- Телефоны `+966 50 000 0XXX`, суммы кратны 500, даты задаются смещениями от `clock.now()`.
- `shared/lib/clock.ts`: `now()`; в демо-режиме по умолчанию реальное время, в тестах — фиксированное (`vi.setSystemTime`, Playwright `page.clock.install({ time: '2026-11-04T09:00:00+03:00' })`).

### 5b.3 `MockAdapter`

- Состояние в памяти + `storage('mock:<persona>')` с полем `schemaVersion`; при несовпадении — сброс к фикстуре (D-072).
- Задержка 300–800 мс (детерминированно от `hash(persona_id + метод)`), инъекция сети `setNetwork('ok'|'slow'|'error'|'offline')`.
- OTP (D-021, D-027): 4 цифры, 5 минут, 5 попыток, повтор через 40 с; канал `sms|whatsapp` — **детерминированно** от `hash(persona_id)`; код `0000` принимается, любой другой — неверный.
- `demoActions` — ровно таблица `01-statuses.md` §10: `submitDocumentSet`, `uwApproveDocument`, `uwRejectDocument`, `uwRequestMoreDocs`, `uwApproveApplication`, `salesConfirmOffer`, `externalSign`, `createDeal`, `payDeal`, `uwReject`, `salesLose`, `createApplication`, `expireSession`, `setNetwork`; плюс из SP-03 §7: `uwApproveSupplierSet`, `uwRejectSupplierDocument`, `odooRequireDocument`; плюс `cancelLimit` (лимит → `cancelled` без закрытия заявки — нужен для SC-06 A7 и SC-07 A4); плюс служебное `setPersona`. Других действий не добавлять. Инварианты мока из §10 (запрет правок после `submitted`, `available ≥ 0`, состав нового комплекта, `turnover` только `payment_done`/`repaid`) — покрыть тестами адаптера.
- Опрос статусов: `useStatusPolling` на TanStack Query (`refetchInterval` из `shared/config/timings.ts`, `refetchOnWindowFocus`, D-035).

**Проверка блока 5b:** каждая персона проходит Zod-валидацию; тесты адаптера на инварианты §10 и на каждое `demoAction` зелёные; `pnpm build` — в первом JS-чанке нет кода фикстур (проверить по `dist/assets` или `vite-bundle-visualizer`); в `src/` нет импорта `@faker-js/faker`.

---

## Блок 5c — аналитика, `HttpAdapter`, контракт

1. `shared/analytics/events.ts` — все события `docs/product/04-metrics-and-events.md` §3 как discriminated union; `track()` с контекстом §2.2; корзины §2.4 (`buckets.ts`, тесты границ); провайдеры `console`, `demo` (лента в демо-панели), `posthog` (заглушка без SDK до SFL-895); `pii-guard.ts` в dev. ESLint: `track` только с литералом из `EventName`. Временный no-op из блока 3 заменить. `role_switched` — уже в v1 (D-067).
2. `scripts/check-events.mjs` (`pnpm check:events`): сравнивает имена и обязательные свойства в `events.ts` с таблицами `docs/product/04-metrics-and-events.md`.
3. `HttpAdapter` — каркас с теми же сигнатурами, каждый метод — `throw new NotImplementedError(port, method)`.
4. `scripts/contract-md.mjs` (`pnpm contract:md`) → `docs/05-backend-contract.md` (русский): порты, сигнатуры, ссылки на `01-entities.md`, требование к лендингу (D-039). `openapi-ts` — позже.

**Проверка блока 5c:** `pnpm check:events` зелёный; `VITE_API_MODE=http pnpm build` собирается; `pnpm verify` (состав 5c) зелёный.

---

## Блок 6a — маршруты, гарды, вход

1. **Маршруты v1 (D-067):** `/`, `/login`, `/login/code`, `/not-found` (SC-01 A8 — `auth.not_found` для `unknown`), `/session-expired`, `/c/home`, `/c/documents` (заглушка «появится в v2» — нужна для A14 SC-01 и сводки на главной), `/c/help`, `/s/home` и `/s/help` (заглушки «появится в v3»), `*` (`system.404`). Поставщики без клиентской роли (`supplier_new`, `supplier_active`) после входа попадают на `/s/home` (заглушка); `dual` — на `/c/home` (D-020).
2. **Гарды:** нет сессии → `/login?returnTo=` (только внутренние пути); чужая семья → свой `home`; `ScreenId` — `shared/config/routes.ts`; `screen_viewed` в `__root` по смене маршрута; 404 — с `path_hash`.
3. **Вход (SC-01, D-020, D-021, D-027):** `PhoneInput` (маска `+966 5X XXX XXXX`, LTR, `inputmode=tel`), `OtpInput` (4 ячейки, автоотправка, таймер 40 с, 5 попыток, `autocomplete="one-time-code"`), все альтернативы A1–A14 сценария.
4. **Тексты:** ключи и значения AR/EN из таблицы §4 SC-01; недостающие формы множественного числа — по блоку 3 п.8.

**Проверка блока 6a:** unit/компонентные тесты на гарды и все альтернативы A1–A14 (каждая — отдельный тест-кейс); `pnpm lint:i18n` зелёный.

---

## Блок 6b — оболочка, настройки, служебные экраны

1. **Оболочка** (`01-cabinet-structure.md` §2 — черновик, брать как гипотезу; расхождения — в `assumptions.md`): шапка с `Wordmark` и названием компании/поставщика, `LanguageSwitch`, `RoleSwitch` для `dual` с одноразовой подсказкой (SP-01), нижняя навигация на мобильном / боковая на ≥ 1280, `SupportBar` (`wa.me` + email, `support_contact_clicked`), офлайн-баннер (состояние, не маршрут), `ErrorBoundary` маршрута.
2. **Настройки** (`/c/help`, `/s/help`, SC-10): язык, тема (`ThemeSwitch` — только здесь, D-025), контакты, версия приложения, выход с единственным диалогом подтверждения (SC10-1). Карточка установки PWA — v5, не делать.
3. **Служебные** (SC-10): `auth.expired`, `system.404`, `storage_unavailable`.
4. Тексты — из §4 SC-10, SP-01 (переключатель).

**Проверка блока 6b:** истории Storybook оболочки, `RoleSwitch`, `SupportBar`, настроек — во всех состояниях × AR/EN × light/dark; `pnpm verify` зелёный.

---

## Блок 6c — главная клиента и демо-панель

1. **Главная** (SC-05 для `home`, `01-cabinet-structure.md` §5–6): `StatusTimeline` (5 шагов, `needs_attention` при `round > 1`, зеркалится), `NextStepCard` (owner `user|tadum|none`, `meta.hours` только из данных — D-033), сводка документов → `/c/documents` (заглушка), тост + баннер смены статуса (D-034) с хранением последнего увиденного статуса через `storage`, опрос (D-035). Блоки `#limit`/`#how-to-buy` — v4, не делать.
2. **Демо-панель** (`VITE_DEMO_PANEL=1`, динамический импорт, в проде не попадает в бандл): плавающая кнопка → `Sheet`: персона (14), язык, тема, сеть, `demoActions` текущей персоны, лента событий (`demo`-провайдер), копирование ссылки с `?persona=&lang=`; персона — в URL (`?persona=`).
3. Тексты — из §4 SC-05.

**Проверка блока 6c:** истории `StatusTimeline`, `NextStepCard`, баннера для всех `client_status` × AR/EN × light/dark; `VITE_DEMO_PANEL=0 pnpm build` — в `dist` нет кода демо-панели; `pnpm verify` зелёный.

---

## Блок 6d — Playwright, axe, скриншоты

1. `playwright.config.ts`: проекты `iphone-safari` (WebKit), `android-chrome`, `desktop-chrome`; `desktop-safari`, `desktop-edge` — в CI по расписанию. `pnpm exec playwright install chromium webkit` (без интерактива). Фиксированное время (`page.clock.install`), `prefers-reduced-motion: reduce`.
2. Сценарии v1: `client_new` → вход (`0000`) → `/c/home` со шкалой на шаге 1; `?persona=client_submitted | client_approved_unsigned | client_closed_rejected` меняют шкалу и карточку; `dual_active` → `/c/home` → переключатель → `/s/home` (заглушка) без потери языка и темы; `supplier_active` → `/s/home`; `unknown_phone` → `/not-found`; `expireSession()` → `/session-expired` → `/login?returnTo=/c/home`.
3. `@axe-core/playwright` на каждом экране v1 в AR и EN, light и dark.
4. **Скриншоты (D-074)** 360/768/1280 × ar/en × light/dark — артефакты (`tests/screenshots/`, в `.gitignore`, загружаются в CI как artifact), **не эталоны**. Визуальная регрессия `toHaveScreenshot` — только если эталоны генерируются в docker-образе Playwright (`mcr.microsoft.com/playwright:v<версия>-noble`, скрипт `pnpm screenshots:update`); эталоны, снятые вне этого образа, не принимаются.
5. `test:e2e:smoke` — один проект (`android-chrome`), без скриншотов — входит в `verify`.

**Проверка блока 6d:** все сценарии п.2 зелёные в трёх проектах; axe без нарушений; скриншоты созданы; `pnpm verify` (с `test:e2e:smoke`) зелёный.

---

## Блок 7a — качество, CI, защита `main`

1. **Скрипты** `package.json`: `dev`, `build`, `preview`, `typecheck`, `lint`, `lint:rtl` (grep физических классов — дублирует ESLint), `lint:i18n`, `lint:gitlab-ci`, `test`, `test:e2e`, `test:e2e:smoke`, `test:a11y`, `screenshots`, `screenshots:update`, `storybook`, `storybook:build`, `deps:check`, `deps:graph`, `knip`, `jscpd`, `check:events`, `contract:md`, `size`, `lhci`, `verify`, `release:proto`, `deploy:preview`. Синхронизации Drive скриптом нет — только скилл (D-064).
2. **Husky + lint-staged + commitlint** (Conventional Commits; scope — срез или `setup`/`docs`/`release`/`design`). **Changesets**; версия приложения из `package.json` — в настройках и событии `app_loaded`.
3. **CI** — `.github/workflows/ci.yml` и зеркальный `.gitlab-ci.yml`, одинаковые jobs `install → typecheck → lint → test → build → e2e (+axe, скриншоты-артефакты) → size` и **итоговый job `ci`** с `needs:` на все остальные (имя обязательной проверки). Lighthouse CI (`lighthouserc.cjs`, пороги §2.2; в v1 — `warn`, с v2 — `error`, D-054) — на `main` и по расписанию. `pnpm audit --audit-level=high`; `gitleaks`. Кэш pnpm; браузеры Playwright — из образа.
4. **`lint:gitlab-ci`** — проверка `.gitlab-ci.yml` по JSON-схеме GitLab CI из SchemaStore (`ajv`); проверка через API GitLab — после переноса, не сейчас.
5. **`knip`** включить в `verify`; если он указывает на неиспользуемое — сначала проверить, не понадобится ли это в v1 (тогда — исключение в конфиге `knip` с комментарием), удалять только действительно лишнее.
6. **PR и защита (D-070):** открыть PR `chore/setup → main` с заполненным шаблоном DoD; дождаться зелёного `ci`. Защита `main`: `gh api -X PUT repos/<owner>/tadum/branches/main/protection` с обязательной проверкой `ci`, запретом force-push, линейной историей **выключенной** (нужны merge-коммиты). Ответ 403 (тариф GitHub для приватного репозитория) — записать в `assumptions.md` и продолжить без защиты. **⏸ Merge PR делает Кирилл** (merge-коммит).
7. **Превью-воркер (D-063):** **⏸** показать `wrangler deploy --dry-run`, после «да» — `pnpm deploy:preview` с `main`; ссылку — в `progress.md`. Деплой из CI включается только после того, как Кирилл сам задаст `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID` в секретах репозитория (агент выводит команды, не выполняет).

**Проверка блока 7a:** `pnpm verify` (полный) зелёный в сессии; PR показывает зелёный `ci`; коммит `fix stuff` отклоняется commitlint (проверить на временной ветке); `pnpm lint:gitlab-ci` зелёный.

---

## Блок 7b — документация разработки

На ветке `chore/setup-2` от `main`. Всё на русском.

- `README.md` — запуск без Claude (полная инструкция для команды); `CONTRIBUTING.md` — ветки, коммиты, PR, worktree, проверки.
- `docs/architecture/layers.md`, `docs/architecture/deps.svg|mmd`.
- `docs/decisions/ADR-001-stack.md`, `ADR-002-design-system.md`, `ADR-003-showcase-publishing.md` (приложение A; в ADR-001 — таблица версий), `docs/decisions/assumptions.md`.
- `docs/05-backend-contract.md` (из 5c), `docs/05-migration-to-gitlab.md` (чек-лист плана §3.5), `docs/analytics.md`, `docs/README.md` (таблица «что где лежит», план §3.6).
- Копии `05-backend-contract.md` и `05-migration-to-gitlab.md` — в Drive `05 Разработка` (через субагента, §0.2).

**Проверка блока 7b:** все файлы на месте; ссылки внутри `docs/` не битые (`markdown-link-check` или простой скрипт).

---

## Блок 8a — `CLAUDE.md`, правила, агенты, скиллы

Тексты — на русском (D-062); имена файлов, ключи фронтматтера, команды — английские.

### 8a.1 `CLAUDE.md` (< 200 строк, факты и ссылки, не процедуры)

Скелет — приложение B. Разделы: что это · источник правды · инварианты §0.3 · структура и команды · цикл фичи · точки решения · где решения (`docs/product/Журнал решений.md`) · языки.

### 8a.2 `.claude/rules/*.md` (с `paths:` где уместно)

`i18n.md` (`src/shared/i18n/**`, `src/**/*.tsx`) · `rtl.md` · `design-system.md` (`src/shared/ui/**`, `src/styles/**`) · `data.md` (`src/shared/api/**`, `src/entities/**`) · `analytics.md` · `tov.md` · `product-docs.md` (`docs/product/**`: только `/sync-product-docs`) · `testing.md` · `secrets-and-shared.md` (инварианты 9–10).

### 8a.3 Субагенты `.claude/agents/*.md`

| Агент | Инструменты | Задача |
|---|---|---|
| `design-system-owner` | Read, Grep, Glob, Edit, Write, Bash(`pnpm dlx shadcn@*`, `pnpm run lint*`, `pnpm run storybook:build`), shadcn MCP | единственный, кому хук разрешает правки `tokens.css` и `shared/ui`; отклоняет сырые значения, ведёт `docs/design/02-tokens.md`; память проекта |
| `ux-researcher` | Read, Mobbin, WebSearch, Playwright MCP | бенчмарк 5–8 паттернов под фичу → Drive `03 Исследования/Бенчмарки и Mobbin` |
| `a11y-usability-reviewer` | Read, Playwright MCP, Chrome DevTools MCP | отчёт WCAG 2.2 AA по экрану |
| `rtl-qa` | Read, Grep, Playwright MCP | логические свойства, зеркалирование, bidi, переносы, порталы; скриншоты AR vs EN |
| `ux-writer` | Read, Edit (только `src/shared/i18n/**`, `docs/i18n/**`) | тексты по TOV и `tov-lexicon.json`, формы множественного числа, глоссарий |
| `code-reviewer` | Read, Grep, Bash (чтение, тесты) | ревью диффа против брифа и DoD |
| `release-manager` | Read, Bash(`pnpm run release:proto*`, `git -C * status*`, `git -C * diff*`, `git -C * log*`), GitHub MCP | подготовка релиза; push и деплой — только после ⏸ |

У каждого — задача, вход, формат отчёта, ссылки на правила; `tools` минимальные.

### 8a.4 Скиллы `.claude/skills/*/SKILL.md`

`/feature-brief <TD-###>` (бриф из `docs/templates/feature-brief.md` → Drive `05 Разработка/Фичи` и Issue), `/plan <TD-###>`, `/verify`, `/design-review`, `/rtl-qa`, `/ux-copy-review`, `/a11y-review`, `/mobbin-research <тема>`, `/sync-product-docs` (процедура блока 1b, PR `docs: sync product docs YYYY-MM-DD`; запускается Кириллом в сессии `TADUM_DOCS_SYNC=1 claude`), `/release-proto <vN>` (обёртка блока 9 + release notes), `/pr` (описание по DoD, changeset, `gh pr create`), `/adr <title>`. Процедуры — здесь, не в `CLAUDE.md`.

**Проверка блока 8a:** `CLAUDE.md` < 200 строк; каждый агент и скилл имеет корректный фронтматтер (сверить формат с документацией Claude Code через Context7); `claude -p "Перечисли инварианты проекта"` выводит пункты §0.3 из `CLAUDE.md`.

---

## Блок 8b — хуки, разрешения, MCP, плагины (последним)

**Перед началом:** все правки `tokens.css` (пресет применён), `shared/ui`, `docs/product/` и `tov-lexicon.json`, которые нужны до v1, закончены. Схему хуков и `settings.json` — сверить с актуальной документацией Claude Code через Context7 до написания.

### 8b.1 Хуки `.claude/settings.json`

Общее: команды — `"$CLAUDE_PROJECT_DIR"/scripts/hooks/<имя>.sh` (абсолютный путь — хуки работают после `cd` в другой каталог); пути из ввода хука нормализуются `realpath --relative-to="$CLAUDE_PROJECT_DIR"`; сообщения — на русском; разбор JSON — `jq`.

| Событие | Матчер | Действие |
|---|---|---|
| `PreToolUse` | `Edit\|Write\|MultiEdit\|NotebookEdit` | `protect-paths.sh`. Защищены: `src/styles/tokens.css`, `src/shared/ui/**`, `src/shared/api/ports/**`, `pnpm-lock.yaml`, `.github/**`, `.gitlab-ci.yml`, `wrangler.jsonc`, `.claude/settings.json`. Пропуск: если вызывающий — субагент `design-system-owner` (для `tokens.css`, `shared/ui`; поле агента во вводе хука сверить со схемой) или в окружении `TADUM_ALLOW_PROTECTED=1` (ставит Кирилл при запуске сессии). `docs/product/**` и `tov-lexicon.json` — блок, если нет `TADUM_DOCS_SYNC=1`. Отказ — `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Защищённый путь: <путь>. Правка через design-system-owner, ADR или с разрешения Кирилла."}}` (формат сверить) |
| `PreToolUse` | `Bash` | `guard-bash.sh`: отказ на `git push --force*`, `git push * main`, `git commit` на ветке `main`, `rm -rf` вне `dist\|node_modules\|.wrangler\|storybook-static\|test-results`, `wrangler secret*`, `gh secret*`, `wrangler deploy` вне `pnpm run deploy:preview`/`release:proto`, `pnpm dlx shadcn* add` вне `design-system-owner` |
| `PostToolUse` | `Edit\|Write\|MultiEdit` | `prettier --write` и `eslint --fix` файла; для `src/shared/i18n/locales/*` — паритет; для `*.tsx` — grep физических классов |
| `Stop` | — | `verify-on-stop.sh`, `"timeout": 900`: если `stop_hook_active == true` — `exit 0`; если `git status --porcelain -- src` пуст — `exit 0`; иначе `pnpm verify`, при падении — отказ остановиться с хвостом лога (формат сверить) |
| `SessionStart` | `startup\|resume\|compact` | вывод инвариантов §0.3 и напоминание: `docs/setup/progress.md`, `docs/product/` |
| `UserPromptSubmit` | — | если в промпте `TD-\d{3}` — напомнить открыть бриф |

Тесты скриптов хуков — `scripts/hooks/__tests__/*.test.ts` (Vitest, подача JSON на stdin).

### 8b.2 Разрешения (D-069)

`permissions` в `.claude/settings.json` — только команды; защищённые **пути** — только хуком (запрет путей в `deny` нельзя обойти даже Кириллу):

```json
"allow": ["Bash(pnpm install*)", "Bash(pnpm run *)", "Bash(pnpm exec *)", "Bash(pnpm dlx shadcn@*)", "Bash(git status*)", "Bash(git diff*)", "Bash(git log*)", "Bash(git add*)", "Bash(git commit*)", "Bash(git switch*)", "Bash(git branch*)", "Bash(git push origin chore/*)", "Bash(git push origin feat/*)", "Bash(git push origin fix/*)", "Bash(gh pr view*)", "Bash(gh pr create*)", "Bash(gh pr checks*)", "Bash(gh run *)", "Bash(gh issue *)", "Bash(wrangler deploy --dry-run*)", "Bash(wrangler whoami*)"],
"ask":   ["Bash(pnpm run release:proto*)", "Bash(pnpm run deploy:preview*)", "Bash(gh pr merge*)", "Bash(gh api *)", "Bash(git -C * push*)", "Bash(git push origin v*)"],
"deny":  ["Bash(git push --force*)", "Bash(git push * main*)", "Bash(gh repo delete*)", "Bash(gh secret*)", "Bash(wrangler secret*)", "Bash(wrangler delete*)"]
```

Синтаксис правил сверить с документацией; `pnpm release:proto` без `run` — закрыт хуком `guard-bash.sh`.

### 8b.3 `.mcp.json` (без секретов)

`shadcn` (`pnpm dlx shadcn@latest mcp`), `playwright` (`@playwright/mcp@<версия>`), `chrome-devtools` (`chrome-devtools-mcp@<версия>`), `context7` (`https://mcp.context7.com/mcp`), `github` (HTTP, токен из переменной окружения), `cloudflare` (`https://mcp.cloudflare.com/mcp`). Google Drive и Mobbin — коннекторы claude.ai, в `.mcp.json` не объявляются. Точные команды/адреса — сверить на дату. `docs/claude-code.md` (русский): как выдать токены, таблицы агентов/скиллов/хуков/разрешений — это `05-claude-code-environment.md`; копия — в Drive `05 Разработка`.

### 8b.4 Плагины

Официальный маркетплейс: `frontend-design`, `code-review`, `typescript-lsp`, `hookify`, `claude-md-management`; `anthropics/knowledge-work-plugins` — `design`. Уровень проекта, назначение — в `docs/claude-code.md`. `superpowers` — не ставить (D-066).

### 8b.5 Проверка блока 8b

Хуки и настройки применяются при старте сессии, поэтому проверка — не «в новой интерактивной сессии», а так:

1. **Скрипты хуков:** тесты `scripts/hooks/__tests__` зелёные; вручную: `echo '{"tool_name":"Edit","tool_input":{"file_path":"'"$PWD"'/src/styles/tokens.css"}}' | scripts/hooks/protect-paths.sh` → в выводе `"permissionDecision":"deny"`; с `TADUM_ALLOW_PROTECTED=1` — разрешение.
2. **Stop-хук:** `claude -p --permission-mode acceptEdits "Добавь пустую строку в конец src/app/main.tsx"` → в выводе виден запуск `pnpm verify`.
3. **`rtl-qa`:** на временной ветке `test/guards` добавить компонент с `ml-4`; `claude -p "/rtl-qa"` называет файл и строку; ветку удалить.
4. **Финальная проверка — ⏸ Кирилл**: в новой облачной сессии на `tadum` попросить поправить `tokens.css` и убедиться в отказе хука. Пункт в отчёте.
5. PR `chore/setup-2 → main` с зелёным `ci`; **⏸ merge — Кирилл**.

---

## Блок 9 — публикация v1 на витрину Proto ⏸

**Цель:** `pnpm release:proto v1` повторяет механизм публикации «Единой активации» (D-019, D-076) для slug `tadum` — безопасно для остальных прототипов. Выполняется в той же среде, где публиковалась «Единая активация» — облачная сессия Claude Code, где доступны оба репозитория и Cloudflare. Путь к клону Proto в сессии — `$PROTO_DIR`, скрипт принимает его аргументом.

1. **Изучить Proto** (`$PROTO_DIR`): README, скрипты публикации, историю коммитов «Единой активации», структуру `p/<slug>/<vN>/`, схему записей `registry.json`, превью `_previews/`, как хранятся пароли (секрет `PROTOTYPE_PASSWORDS` или иначе). Не изобретать: повторить. Если публикация делалась командами вручную — оформить их в `scripts/release-proto.mjs` и `docs/release.md`.
2. **Скрипт** `scripts/release-proto.mjs` (`pnpm run release:proto vN`):
   1. Tadum: чистое дерево, ветка `main` или `chore/release-*`, полный `pnpm verify` зелёный.
   2. Proto: `git -C $PROTO_DIR fetch && git -C $PROTO_DIR status --porcelain` пусто; `git -C $PROTO_DIR merge --ff-only origin/main`; при расхождении — остановиться с сообщением.
   3. Сборка: `VITE_BASE_PATH=/p/tadum/vN/ VITE_DEMO_PANEL=1 VITE_ANALYTICS=demo VITE_PROTO_VERSION=vN pnpm build`.
   4. Копирование `dist/` → `$PROTO_DIR/p/tadum/vN/` **без** `_headers` (у превью `noindex`, витрина управляет заголовками сама).
   5. `registry.json` — **идемпотентно** по существующей схеме Proto (схема Proto главнее ориентира ниже): запись `tadum` создаётся, если её нет; версия `vN` добавляется или обновляется, без дублей; предыдущая `current` → `archived`; `defaultVersion` = `vN`. Ориентир: `{ "slug": "tadum", "title": "Tadum — кабинеты клиента и поставщика", "versions": [{ "version": "v1", "status": "current", "routing": "history" }], "defaultVersion": "v1", "separatePassword": true }`.
   6. Превью `_previews/tadum.png` (Playwright: главная клиента 1280×800, AR, светлая тема), если в Proto так принято.
   7. Коммит в Proto `feat(tadum): publish vN` (без push).
   8. **⏸ Решение Кирилла:** вывести `git -C $PROTO_DIR diff --stat HEAD~1`, diff `registry.json`, результат `wrangler deploy --dry-run` из Proto; ждать «да».
   9. После «да»: `git -C $PROTO_DIR push origin main`; деплой Proto тем же способом, что для «Единой активации»; тег `vN` в Tadum ставит и пушит скрипт (`git tag vN && git push origin vN`).
   10. Вывести ссылку `https://proto.kirillgloba.workers.dev/p/tadum/vN/` и команду отката (`wrangler rollback` в Proto и `git -C $PROTO_DIR revert`).
3. **Пароль (D-068) — ⏸ делает Кирилл.** Агент не выполняет `wrangler secret put` и не видит пароль. Он пишет: «Откройте дашборд Cloudflare → Workers → `proto` → Settings → Variables and Secrets → `PROTOTYPE_PASSWORDS` и сохраните **полный** JSON паролей всех прототипов плюс ключ `"tadum": "<пароль>"`. Значение секрета нельзя прочитать обратно — если сохранить только `tadum`, остальные прототипы перестанут открываться». Если в Proto пароли устроены иначе (KV, отдельные секреты) — дать соответствующую инструкцию. Ждать «пароль установлен».
4. **Release notes** `docs/releases/v1.md` (русский): что вошло, что отложено, известные ограничения, как смотреть (персоны, ссылки `?persona=`, два пароля — без значений), что проверить команде; копия в Drive `06 Версии прототипа/v1.md`.
5. **Инструкция для зрителей** `docs/releases/how-to-view.md`.

**Проверка блока 9:** после двух паролей открывается `/p/tadum/v1/`; прямой переход `/p/tadum/v1/c/home?persona=client_submitted&lang=en` отдаёт приложение; `curl -b <cookie сессии> …/p/tadum/v1/manifest.webmanifest` возвращает JSON со `scope` и `start_url` = `/p/tadum/v1/`; `/p/tadum/latest/` ведёт на v1; в `registry.json` одна запись `tadum`; другие прототипы витрины открываются по своим паролям (проверить хотя бы «Единую активацию»).

---

## Блок 10 — критерии приёмки среды и отчёт

- [ ] `pnpm verify` (полный) зелёный на `main`; `ci` зелёный в GitHub; `pnpm lint:gitlab-ci` зелёный.
- [ ] `storybook:build` собирается; глобалы `locale` и `theme` работают; истории `shared/ui` и `widgets` v1 во всех состояниях.
- [ ] Витрина показывает v1 по двум паролям; персоны переключаются из демо-панели и по `?persona=`; другие прототипы не затронуты.
- [ ] Тесты скриптов хуков зелёные; `protect-paths.sh` отказывает на `tokens.css`; Stop-хук запускает `pnpm verify`; `rtl-qa` находит внесённый `ml-4`; интерактивная проверка — ⏸ Кирилл.
- [ ] `docs/product/` — дословный снимок Drive; `docs/` содержит README, CONTRIBUTING, ADR-001…003, контракт бэкенда, чек-лист GitLab, release notes v1, `assumptions.md`, `i18n/needs-review.md`.
- [ ] Пресет shadcn Кирилла применён; токены Tadum выведены из него и задокументированы в `docs/design/02-design-system.md` (копия в Drive).
- [ ] Итоговый отчёт Кириллу (и в `docs/setup/progress.md`): что сделано по блокам, допущения, оставшиеся ⏸, предложенные D-### для журнала, ссылки (PR, превью, витрина).

---

## Что агент делает после мастер-промпта (сессия 12 плана)

Первая фича по полному циклу — `TD-001 SC-01 Первый вход` (большая часть уже сделана в 6a; фича доводит до DoD): `/feature-brief TD-001` → `/plan` → worktree → `/verify` → `/rtl-qa` → `/pr` → ревью → merge. Цель — проверить, что процесс и хуки не требуют ручных обходов; расхождения — в бриф и `assumptions.md`.

---

## Открытые вопросы мастер-промпта

Решено (Кирилл, 2026-11-04): **MP-1** — `CLAUDE.md`, `.claude/**` и комментарии в коде — на русском (D-062). **MP-2** — превью-воркер `tadum` нужен (D-063). **MP-3** — синхронизация Drive скиллом через MCP (D-064). **MP-4** — `superpowers` не ставим (D-066). **MP-5** — Zod 4 (D-065). Среда — веб-версия Claude Code по умолчанию (D-076); основа дизайн-системы — пресет shadcn Кирилла, выбора из вариантов нет (D-077). По итогам ревью (D-067…D-075): состав маршрутов v1, секреты только у Кирилла, ⏸ перед push/деплоем общих ресурсов, модель веток setup, ручная сборка форматтеров, изоляция хранилища по базовому пути, рукописные фикстуры и фиксированные часы, скриншоты как артефакты, плейсхолдеры `{…}`.

Открытых вопросов нет. Точки ⏸ по ходу выполнения: создание репозитория, если у сессии нет прав (0); пресет shadcn, если не передан (4a) или требует не Radix; `account_id` при нескольких аккаунтах Cloudflare и проблемы доступа к Cloudflare (0); merge PR (7a, 8b); первый деплой превью (7a); интерактивная проверка хуков (8b); пароль витрины, push и деплой Proto (9).

---

## Приложение A — ADR (тексты для `docs/decisions/`)

### ADR-001 — Стек и архитектура

**Статус:** принят (D-003, D-065) · **Дата:** 2026-11-04

**Контекст.** Нужен фронтенд без бэкенда, который (1) собирается в статику под произвольный базовый путь для витрины `/p/tadum/vN/`, (2) равноправно поддерживает арабский RTL и английский LTR, (3) устанавливается как PWA, (4) переезжает из GitHub в GitLab без изменений кода, (5) состоит из технологий, которые агенты знают хорошо и в актуальных версиях.

**Рассмотрено.** Vite + React + TanStack Router (SPA) · React Router v7 framework mode (`ssr:false`) · TanStack Start (SPA mode) · Next.js + OpenNext. Сравнение — план §3.1.

**Решение.** Vite 7 (проект собран вручную, без шаблона) + React 19 + TypeScript strict + TanStack Router (файловые маршруты в `src/pages`, дерево в `src/app/routeTree.gen.ts`, `basepath` из `import.meta.env.BASE_URL`) + TanStack Query как единственный слой данных + shadcn/ui на Radix с `rtl: true` + Tailwind v4 + react-i18next (JSON v4, плейсхолдеры `{…}`) + vite-plugin-pwa (`generateSW`, `autoUpdate`, `useCredentials`) + Cloudflare Workers static assets + Zod 4. Архитектура FSD-lite (`app/pages/widgets/features/entities/shared`) с машинной проверкой границ (`eslint-plugin-boundaries`, `dependency-cruiser`, `knip`, `jscpd`). Данные — через порты; `MockAdapter` (рукописные фикстуры, динамический импорт) сейчас, `HttpAdapter` потом. Форматирование — собственный `shared/i18n/format.ts` поверх `Intl` для чисел и месяцев. Готовый стартер не используется.

**Последствия.** Плюсы: чистый `dist/`, тривиальный базовый путь, типизированные маршруты, отсутствие серверного кода, одинаковый деплой в обоих CI. Минусы: нет SSR (не нужен — портал за входом); ручная сборка скелета; за актуальностью паттернов TanStack следить через Context7. Пересмотр — при появлении требований SEO или серверных функций.

**Приложение:** таблица точных версий пакетов на дату инициализации (заполняет агент в блоке 1).

### ADR-002 — Дизайн-система

**Статус:** принят (D-004, D-015, D-016, D-025, D-077) · **Дата:** 2026-11-04

**Контекст.** Бренда (палитры, логотипа) нет; есть требование двух письменностей, двух тем и запрета на «кредитную» агрессию; Figma-зеркала не будет.

**Решение.** shadcn/ui (Radix, RTL) как база, компоненты в `src/shared/ui`; токены — CSS-переменные oklch в `src/styles/tokens.css` с семантическими токенами статусов и прогресса лимита; две темы через `.dark`, по умолчанию системная, переключатель в настройках; шрифты: латинский — из пресета (по умолчанию Geist Variable), арабский — IBM Plex Sans Arabic через `:lang(ar)`, self-hosted; иконки lucide с явным списком зеркалируемых; Storybook — единственный источник документации компонентов (истории AR/EN × light/dark); основа темизации и токенов — пресет shadcn, который задаёт Кирилл в конструкторе тем shadcn (D-077); поверх него — семантические токены Tadum (статусы, прогресс лимита, движение), выведенные из палитры пресета; `shared/ui` и `tokens.css` защищены хуком, правки — через субагента `design-system-owner`.

**Последствия.** Дизайн задаётся Кириллом до разработки, агент не выбирает внешний вид; смена темы — новый пресет и правка одного файла; компоненты не содержат сырых значений (lint); цена — дисциплина токенов и отсутствие визуального редактора; при появлении бренда — обновление токенов и `Wordmark`, не компонентов.

### ADR-003 — Витрина Proto и публикация версий

**Статус:** принят (D-018, D-019, D-059, D-061, D-068, D-069, D-072, D-076) · **Дата:** 2026-11-04

**Контекст.** Команда смотрит прототип на витрине Proto (Cloudflare Worker Кирилла) с общим паролем и паролем прототипа; на той же витрине живут другие прототипы; Tadum — отдельный репозиторий, который позже уедет в GitLab; Proto остаётся в GitHub навсегда.

**Решение.** Tadum публикуется на витрину скриптом `pnpm run release:proto vN` из репозитория Tadum, повторяющим механизм публикации «Единой активации»: сверка Proto с `origin/main`, сборка с `VITE_BASE_PATH=/p/tadum/vN/`, копирование в `proto/p/tadum/vN/`, идемпотентная запись версии в `registry.json` по схеме Proto (`routing: history`, `separatePassword: true`), коммит; push в `main` Proto и деплой — только после подтверждения Кирилла с показанным diff и dry-run; затем тег `vN`. Пароль Tadum в секрете `PROTOTYPE_PASSWORDS` ставит сам Кирилл (значение секрета не читается обратно — перезапись одним ключом сломала бы остальные прототипы). На витрине включены демо-панель и `?persona=`, аналитика — только `demo`/консоль. Отдельной «v0» нет. Prod/превью-деплой Tadum (`wrangler deploy` воркера `tadum`) — отдельный путь.

**Последствия.** Публикация — осознанное действие, не следствие merge; версии разделены путём, `scope` PWA и префиксом ключей хранилища `tadum:<base>:` (cookie и origin у всех версий и прототипов общие — изоляция обеспечивается кодом, не браузером); зрителю нужны два пароля; публикация выполняется там же, где публиковалась «Единая активация» — в облачной сессии Claude Code с той же конфигурацией, что у «Единой активации» (D-076); остановки перед push и деплоем заложены в сам скрипт, а не только в хуки.

---

## Приложение B — скелет `CLAUDE.md` (русский, D-062; заполняет агент)

```md
# Tadum — кабинеты клиента и поставщика (KSA)
Фронтенд-прототип без бэкенда: данные через порты и MockAdapter. Арабский по умолчанию, RTL и LTR равноправны, PWA. Публикуется на витрину Proto как /p/tadum/vN/.

## Источник правды
Продуктовые документы — в Google Drive (русский). `docs/product/` — дословный снимок: правится только скиллом /sync-product-docs, правки предлагать текстом. Решения — `docs/product/Журнал решений.md` (D-###). История настройки — `docs/setup/`.

## Инварианты
1. Арабский по умолчанию; каждый экран в ar/en × light/dark. 2. Ни одной строки в коде; ключи с паритетом ar/en; lint по лексикону TOV. 3. Данные только через `shared/api/ports`. 4. Только токены; `tokens.css` и `shared/ui` меняет design-system-owner. 5. Нет PII в URL, хранилище, аналитике, логах; хранилище — только через `shared/lib/storage.ts`. 6. Английский — код, идентификаторы, коммиты, ключи, события; русский — всё остальное, включая этот файл и комментарии. 7. `docs/product/**` — только через /sync-product-docs. 8. Перед остановкой — `pnpm verify` зелёный. 9. Секреты ставит только Кирилл. 10. Push/деплой общих ресурсов (Proto, превью, merge в main) — только после «да» Кирилла. 11. Не угадывать: дефолты из «Открытых вопросов» документов, иначе → `docs/decisions/assumptions.md`. 12. Флаги и API — проверять `--help` и Context7.

## Структура и команды
Слои: app → pages → widgets → features → entities → shared (см. docs/architecture/layers.md). `pnpm verify`, `pnpm test:e2e`, `pnpm storybook`, `pnpm run release:proto vN`.

## Цикл фичи
/feature-brief TD-### → /plan → worktree → /verify → при необходимости /rtl-qa, /design-review, /ux-copy-review → /pr → ревью → merge → /release-proto vN, когда накопилось.

## Когда спрашивать Кирилла
Решения нет в docs/product и журнале; нужно менять защищённый путь; нужен новый порт; нужен секрет или пароль; push/деплой общих ресурсов; merge в main.
```
