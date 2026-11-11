# 02 · Дизайн-система Tadum

**Статус:** блок 4a, 2026-11-05; каркас кабинета — 2026-11-06 · **Основа:** пресет shadcn Кирилла (D-077), ADR-002 · **Копия:** Google Drive `Tadum/02 Дизайн-система и бренд`.

## 1. Пресет

Пресет передал Кирилл командой конструктора тем shadcn:

```bash
pnpm dlx shadcn@latest init --preset b1ZQ7Gl9c --base radix --template vite --rtl --pointer
```

Применён к уже созданному проекту без `--template` (проект собран вручную, §1.2 мастер-промпта; A-001):

```bash
pnpm dlx shadcn@4.23.0 init --preset b1ZQ7Gl9c --base radix --rtl --pointer -y --no-monorepo
```

Что задаёт пресет (расшифровка CLI):

| Параметр | Значение |
| :--- | :--- |
| Примитивы | Radix (`radix-ui`) — как требует D-003 |
| Стиль | `radix-maia` |
| Базовый цвет | `mist` (нейтральная серо-голубая шкала) |
| Тема | `blue` (`--primary` — синий, oklch 0.488 0.243 264.4) |
| Радиус | `large` (`--radius: 0.875rem`) |
| Шрифт | Geist (`@fontsource-variable/geist`, семейство `"Geist Variable"`) |
| Иконки | Remix Icon (`@remixicon/react`) |
| Меню | `menuColor: default`, `menuAccent: subtle` |
| Графики | `chartColor: blue` |
| RTL | `rtl: true` — компоненты на логических классах (`ms-/me-/start-/end-`, `rtl:`-варианты) |
| Курсор | `pointer` на кнопках |

Токены пресета (палитра `:root` и `.dark`, `--radius`) лежат в `src/styles/tokens.css` **без изменений**. Сверка: 64 строки токенов из вывода CLI побайтно совпали с файлом `docs/setup/inputs/shadcn-theme-tokens.css`, который передал Кирилл.

`components.json`: стиль `radix-maia`, `rtl: true`, алиасы `ui`/`components` → `@/shared/ui`, `utils` → `@/shared/lib/utils`, `lib` → `@/shared/lib`, `tailwind.css` → `src/styles/globals.css`. Компоненты (20 шт.) добавлены CLI в `src/shared/ui`.

2026-11-06 (каркас кабинета на блоке `sidebar-08`, решение Кирилла): `pnpm dlx shadcn@4.23.0 add sidebar breadcrumb -y` — новые `sidebar.tsx`, `breadcrumb.tsx`, хук `src/shared/lib/hooks/use-mobile.ts` (алиас `hooks`; экспорт `useIsMobile` из `@/shared/lib`). Перезапись `sheet.tsx` CLI предложил и получил отказ — проектные правки Sheet (i18n кнопки закрытия, исключение RTL) сохранены; `button`, `separator`, `tooltip`, `input`, `skeleton` совпали побайтно. Итого компонентов CLI — 22.

## 2. Файлы стилей

| Файл | Что в нём |
| :--- | :--- |
| `src/styles/tokens.css` | Часть 1 — токены пресета без изменений; часть 2 — семантические токены Tadum. Единственное место с сырыми цветами, px и мс |
| `src/styles/fonts.css` | Geist (латиница) и IBM Plex Sans Arabic 400/500/600/700 (арабский), `:lang(ar)` переключает семейство и интерлиньяж |
| `src/styles/globals.css` | Tailwind, `@theme inline` и `@layer base` от CLI; добавлены только сопоставления токенов Tadum с классами Tailwind |

## 3. Семантические токены Tadum и как они выведены

Значения выводятся из палитры пресета: оттенки (hue) и нейтральные ступени взяты из пресета, светлота подобрана так, чтобы выполнить AA.

| Токен | Светлая тема | Тёмная тема | Откуда |
| :--- | :--- | :--- | :--- |
| `--status-pending` | oklch(0.45 0.021 213.5) | oklch(0.8 0.016 213.5) | оттенок `--muted-foreground` пресета (mist 213.5), темнее/светлее для AA |
| `--status-pending-muted` | = `--muted` (0.963 0.002 197.1) | = `--muted` тёмной темы | `--muted` пресета |
| `--status-received` | = `--primary` (0.488 0.243 264.4) | oklch(0.78 0.12 258) | `--primary` пресета; в тёмной — светлый вариант того же синего |
| `--status-received-muted` | oklch(0.955 0.025 264) | oklch(0.3 0.07 264) | оттенок `--primary`, низкая насыщенность |
| `--status-rejected` | oklch(0.5 0.15 45) | oklch(0.8 0.12 60) | тёплый «внимание»: между `--destructive` (27) и янтарным; не красный error — «нужен новый файл», без вины (TOV) |
| `--status-rejected-muted` | oklch(0.962 0.03 60) | oklch(0.3 0.06 50) | тот же оттенок, фон бейджа |
| `--status-approved` | oklch(0.47 0.12 155) | oklch(0.8 0.13 155) | спокойный зелёный, светлота как у остальных статусов |
| `--status-approved-muted` | oklch(0.962 0.035 155) | oklch(0.29 0.05 155) | тот же оттенок |
| `--status-*-foreground` | светлые ступени пресета (`--primary-foreground`, `--sidebar`) | `--foreground` светлой темы (0.148) | текст на заливке статуса |
| `--limit-track` | = `--border` (0.925 0.005 214.3) | = `--muted` тёмной темы | нейтральная ступень пресета |
| `--limit-fill` | `var(--primary)` | `var(--sidebar-primary)` | синий пресета; в тёмной — более светлый синий пресета, иначе 2.0:1 к дорожке |
| `--whatsapp` | oklch(0.65 0.17 149.7) ≈ `#20AA52` | = светлой | зелёный WhatsApp: тон фирменного `#25D366` (oklch 0.761 0.201 149.7), светлота снижена до 0.65 — темнее для контраста с белым текстом, но ещё узнаваемый зелёный бренда (решение Кирилла 2026-11-11, «не слишком тёмный»). Одинаков в обеих темах (2026-11-06) |
| `--whatsapp-foreground` | oklch(1 0 0) — белый | = светлой | белый текст бренда — 3.01:1 на `--whatsapp` с 2026-11-11 (было 1.98:1 на `#25D366`; не AA); Кирилл осознанно принимает исключение (решение 2026-11-06), до этого был тёмный `--foreground` (9.94:1) |
| `--elevation-sm/md` | тени с цветом `--foreground` 6 % и 8 % | `none` (в тёмной теме — границы) | §3.3 |
| `--elevation-inset` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | = светлой | значение `shadow-sm` Tailwind/shadcn; тень контейнера контента `SidebarInset`, как в `sidebar-08` (решение Кирилла 2026-11-06). `--elevation-sm` слабее и в тёмной теме `none`, поэтому тени не было видно. Класс — `shadow-inset` |
| `--motion-fast/base/slow` | 120 / 200 / 320 ms | — | §3.3; при `prefers-reduced-motion` — 0ms |
| `--ease-standard` | cubic-bezier(0.2, 0, 0, 1) | — | §3.3 |
| `--motion-bounce` | 480 ms | — | лёгкий отскок (экран документов клиента, решение Кирилла 2026-11-10); при `prefers-reduced-motion` — 0ms, как остальные `--motion-*`. Класс — `duration-bounce` |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | — | кривая с перелётом ≈ 10 % (2026-11-10). Класс — `ease-bounce` |
| `--motion-beam` / `--motion-beam-pause` | 2000 / 2000 ms | — | проход блика `BorderBeam` по периметру и пауза с серой обводкой (решение Кирилла 2026-11-11). Доля прохода в цикле (50 %) зашита в `@keyframes border-beam` — меняются вместе. В reduced-motion не обнуляются: анимацию снимает утилита |
| `--beam-color` | `var(--primary)` | `var(--sidebar-primary)` | цвет дуги и свечения. В тёмной — более светлый синий пресета: `--primary` тёмной темы (0.424) на тёмной карточке почти не виден. В `.dark` переобъявлен обязательно — `var(--primary)` в `:root` вычисляется в `:root` |
| `--beam-width` | 1px | — | толщина дуги = толщина `border`: дуга перекрашивает обводку, а не рисует вторую |
| `--beam-arc` | 0.35 | — | полуоси эллипса-маски — доля полупериметра контейнера (дуга с хвостами ≈ 35 % периметра), но не больше 90 % ширины и высоты |
| `--beam-core` | 15 % | — | насыщенное ядро маски (доля радиуса эллипса), дальше линейный спад к нулю |
| `--beam-glow-radius` | 2.5rem | — | вынос слоя свечения за контейнер (≥ крайнего blur в `--beam-glow`) |
| `--beam-glow` | 8 слоёв `box-shadow` (4 inset, 4 наружу; blur 1–36px), `color-mix(--beam-color 45…4 %)` | те же слои, альфа 70…7 % | мягкое свечение у дуги: внутрь — тонкий ореол в несколько px, наружу — слабое. На светлой поверхности сдержанно, на тёмной сильнее. В `.dark` переобъявлен — `color-mix` в `:root` вычислен с цветом светлой темы |
| `--motion-pulse` / `--motion-pulse-rest` | 1200 / 1000 ms | — | расхождение кольца `PulseDot` и пауза (2026-11-11). Доля пульса (54.5 %) зашита в `@keyframes pulse-ring`. В reduced-motion кольцо скрыто утилитой |
| `--ease-pulse` | cubic-bezier(0, 0, 0.2, 1) | — | замедление к концу: кольцо быстро отходит от точки и мягко гаснет |
| `--text-fade-length` | 1.75rem | — | зона затухания `text-fade-end` (2026-11-11) |
| `--mask-solid` | oklch(0 0 0) | — | непрозрачный цвет для `mask-image` (маска берёт только альфу); нужен, потому что Stylelint запрещает именованные и сырые цвета вне `tokens.css` |
| `--mask-faint` | oklch(0 0 0 / 10%) | — | слабая альфа маски: подкраска остальной обводки, пока идёт блик |

Сопоставление со статусами: документы `needed`→`pending`, `uploaded`→ зелёная палитра `approved` (решение Кирилла 2026-11-10; от `accepted` отличается иконкой `RiCheckLine`), `needs a new file`→`rejected`, `accepted`→`approved`; шкала и чек-лист: `needs_attention`/`failed` = `rejected`; `supplier_view`: `applied`/`collecting_docs`→`pending`, `under_review`→`received`, `approved`/`first_purchase`→`approved`, `closed` → нейтральный `muted` (не `rejected`). Компонент — `StatusBadge` (иконка + текст + цвет).

Классы Tailwind: `bg-whatsapp`, `text-whatsapp-foreground`, `bg-status-pending-muted`, `text-status-received`, `bg-limit-fill`, `shadow-sm`, `shadow-inset`, `duration-base`, `ease-standard`, `duration-bounce`, `ease-bounce`, `animate-pulse-ring`, `text-fade-end`, `font-wordmark` и т. д.

**Бегущий блик обводки `BorderBeam`** (решение Кирилла 2026-11-11; приём по образцу React Bits Border Glow — обводка цвета блика и слои свечения под общей маской, — реализация своя, без пакета и без копирования кода: лицензия оригинала MIT + Commons Clause). Заменил свечение-волну `animate-glow-wave` 2026-11-10 — её `@keyframes`, утилита и токены `--glow-primary*`, `--motion-glow`, `shadow-glow-primary*` удалены.

Вид: обводка контейнера — обычная серая `border` толщиной 1px. По ней с постоянной скоростью проходит длинная синяя дуга той же толщины — насыщенная в середине, с длинными мягкими хвостами до полной прозрачности (≈ 30–35 % периметра); у дуги — мягкое свечение внутрь (несколько px) и слабое наружу. Пока идёт проход, остальная обводка чуть подкрашена. Один круг за `--motion-beam`, затем `--motion-beam-pause` блика нет и обводка серая, и снова, бесконечно. Старт — у верхнего левого угла, обход по часовой в обоих направлениях письма (направление обхода с направлением текста не связано); в начале и конце прохода прозрачность мягко нарастает и гаснет — по ≈ 720 ms (18 % цикла), кривая smoothstep (ease-in-out) ступенями 0 → 0.1 → 0.35 → 0.65 → 0.9 → 1 через каждые 3.6 % цикла; `animation-timing-function` не используется, чтобы `--beam-p` оставался линейным (решение Кирилла 2026-11-11: «начало и затухание мягче»). Полная яркость — с 0.72 до 1.28 s прохода.

Устройство (`@utility border-beam`, `border-beam-edge`, `border-beam-glow`, `@property --beam-p`, `@keyframes border-beam` в `globals.css`): корневой слой `border-beam` — `absolute`, выходит за padding-box контейнера на `--beam-width` (ровно на обводку), `border-radius: inherit`, `container-type: size`. `--beam-p` (зарегистрированное `<number>`) идёт 0 → 1 линейно — доля периметра; из неё в единицах контейнера (`cqw`/`cqh`) считается точка блика на периметре `--beam-x`/`--beam-y` (через `clamp`, без деления длин). `border-beam-edge` — обводка `--beam-color` толщиной `--beam-width`; `border-beam-glow` — слой шире контейнера на `--beam-glow-radius`, его `::before` совпадает с border-box контейнера и несёт `box-shadow: var(--beam-glow)`. Оба под маской `radial-gradient` — эллипс вокруг точки блика: ядро `--beam-core` непрозрачно, дальше спад к краю эллипса; у обводки за эллипсом — `--mask-faint`, у свечения — ноль. Полуоси — `--beam-arc` полупериметра, но не больше 90 % ширины и высоты: на длинной грани широкой панели эллипс не дотягивается до противоположной грани, на коротком торце огибает оба угла. Конус `conic-gradient` из центра, как в оригинале, на широкой панели (≈ 800×120) освещал обе длинные грани сразу и двигался неравномерно — проверено кадрами Playwright, поэтому заменён эллипсом у точки.

При `prefers-reduced-motion: reduce` анимации и свечения нет: вся обводка статично окрашена в `--beam-color`. Раскладку не меняет, `aria-hidden`, `pointer-events: none`; смысл состояния на нём не держится. Свечение выходит за контейнер на `--beam-glow-radius`: у контейнера и ближайших предков не должно быть `overflow: hidden`. История — `shared/ui/Motion/BorderBeam` (широкая карточка `min-h-30`; play: слой совпадает с border-box контейнера и наследует радиус, толщина дуги = толщина обводки, маски — эллипс, свечение шире контейнера, цикл 4 s `linear infinite`, на 1 s `--beam-p` = 0.5 и блик виден, на 3 s — погашен).

**Пульсирующая точка `PulseDot`** (2026-11-11): точка `size-2` цвета статуса и кольцо того же цвета (`animate-pulse-ring`, `@keyframes pulse-ring`): кольцо стартует с прозрачностью 0.45 и масштабом 1, за `--motion-pulse` вырастает до 2.75 и гаснет до 0, затем пауза `--motion-pulse-rest`. При reduced-motion кольца нет. История — `shared/ui/Motion/PulseDot`.

**Затухание строки `text-fade-end`** (`@utility` в `globals.css`, 2026-11-11): `white-space: nowrap; overflow: hidden` и `mask-image` — последние `--text-fade-length` уходят в прозрачность к концу строки: справа в LTR, слева в RTL (`:dir(rtl)`). Заменяет многоточие `truncate` там, где обрезка должна быть мягкой (имя компании в кнопке аккаунта сайдбара). Элементу нужна ширина контейнера (блок, grid-элемент, flex-элемент с `min-w-0`): у элемента шириной по тексту зона затухания ляжет на сам короткий текст. Полный текст — в доступном имени или подсказке, если обрезка скрывает смысл. История — `shared/ui/TextFade/FadeEnd` (play: переполнение без переноса; в EN маска `to right`, в AR — `to left`).

**Исправление 2026-11-10:** утилиты `duration-*` в Tailwind v4 берут значения из пространства `--transition-duration-*`. В `@theme` было `--duration-fast/base/slow`, поэтому `duration-fast`, `duration-base`, `duration-slow` не генерировались, и элементы шли с 150 ms по умолчанию. Теперь сопоставление — `--transition-duration-{fast,base,slow,bounce}: var(--motion-*)`; существующие вызовы получили задуманные длительности.

**Раскрытие по высоте** (`@utility` в `globals.css`, 2026-11-10, липкая панель отправки): `grid-rows-collapsed` (`grid-template-rows: 0fr`), `grid-rows-expanded` (`1fr`), `transition-grid-rows` (`transition-property: grid-template-rows`; длительность и кривая — `--tw-duration`/`--tw-ease` с откатом на значения по умолчанию Tailwind, как у встроенных `transition-*`, поэтому работают `duration-bounce ease-bounce`). Разметка: `grid grid-rows-collapsed|expanded transition-grid-rows duration-bounce ease-bounce` на обёртке, `min-h-0 overflow-hidden` на единственном дочернем элементе. Заменяют произвольные `grid-rows-[0fr]` и `transition-[grid-template-rows]`, запрещённые ESLint. При reduced-motion `--motion-bounce` = 0ms, раскрытие мгновенное.

## 4. Контраст (WCAG 2.2 AA)

`pnpm check:contrast` (`scripts/check-contrast.mjs`) считает контраст по токенам `tokens.css` в обеих темах. Результат на 2026-11-05 — **все пары Tadum проходят**, кроме принятого исключения WhatsApp (с 2026-11-06):

| Пара | Светлая | Тёмная |
| :--- | ---: | ---: |
| статус на своём `-muted` (бейдж), мин. по 4 статусам | 5.70 | 6.85 |
| `-foreground` на заливке статуса, мин. | 6.12 | 9.83 |
| статус на `--background` / `--card`, мин. | 6.40 | 8.66 |
| `--limit-fill` против `--limit-track` (нужно ≥ 3) | 5.48 | 3.98 |
| `--whatsapp-foreground` на `--whatsapp` (белый; с 2026-11-11 зелёный темнее, было 1.98) | 3.01 | 3.01 |

Пара WhatsApp не проходит AA (нужно 4.5) и **принята как исключение** решением Кирилла 2026-11-06: белый текст — фирменный вид кнопки WhatsApp. Это осознанное отступление от A-019 только для этой пары; другие пары правило по-прежнему не ослабляют. Зелёный 2026-11-11 — баланс по просьбе Кирилла «темнее, но не слишком»: 3.0:1 при узнаваемом зелёном бренда. Сама заливка против светлого фона — 3.01:1, против тёмного фона и карточки — 6.54 и 5.76:1: граница кнопки не несёт смысла (у кнопки есть текст и иконка), 1.4.11 не требуется.

Дополнительно истории Storybook проверяются axe (`@storybook/addon-a11y`, режим `error`) в тестах `pnpm test:stories`.

### Замечания к пресету — приняты как есть

**Решение Кирилла (2026-11-05): контраст не менять нигде** — ни в пресете, ни в токенах Tadum, ни в компонентах. Значения ниже зафиксированы как известные и не считаются задачей. Скрипт и axe нашли места, где сам пресет не дотягивает до AA:

| Где | Контраст | Нужно | Статус |
| :--- | ---: | ---: | :--- |
| `--muted-foreground` на `--muted` (светлая) | 4.15 | 4.5 | принято, не менять |
| `--ring` на `--background` (светлая; фокус-рамка, к тому же `outline-ring/50`) | 2.44 | 3 | принято, не менять |
| `Button variant="destructive"` (красный текст на `destructive/10`) | 4.0 | 4.5 | принято, не менять |
| `AlertDescription` в `Alert variant="destructive"` | 4.49 | 4.5 | принято, не менять |

Истории `Button/Destructive` и `Alert/Destructive` помечены `a11y: { test: 'todo' }`: замечание видно в Storybook, тесты не падают. Остальное в пресете проходит AA. Агенты не правят контраст без нового решения Кирилла.

## 4a. Компоненты кабинета (2026-11-06)

Каркас кабинета — блок shadcn `sidebar-08` (`variant="inset"`: фон `--sidebar`, контент в контейнере с обводкой; на мобильных — Sheet по кнопке). Блок и виджет собирает `src/widgets/cabinet-shell`; в `shared/ui` — только примитивы. Токены `--sidebar*` пресета уже были, не менялись (A-019). Иконки пунктов — 20 px, как в выпадающих меню (Кирилл 2026-11-06).

**Sidebar** (`sidebar.tsx`), адаптация Tadum:

| Что | Как |
| :--- | :--- |
| Cookie `sidebar_state` | Запись убрана (D-072: хранилище только через `storage.ts`). Сохранение — у владельца: контролируемые `open` / `onOpenChange` у `SidebarProvider` (история `ControlledOpen`) |
| Сторона | `Sidebar side` — `"start"` по умолчанию (`"end"`, `"left"`, `"right"` — тоже). Физическая сторона вычисляется из `Direction.useDirection()` Radix: в RTL справа, в LTR слева; мобильный Sheet — с той же стороны и с `dir` направления. Подсказки свёрнутого меню (`SidebarMenuButton tooltip`) — со стороны end. Внутри компонента классы `left-/right-` осознанно физические (сторона уже физическая) — с `eslint-disable` и причиной |
| `SidebarRail` | Классы CLI смешивали физические и `rtl:`-инверсии — для правого сайдбара в RTL полоса вставала не туда; приведены к физическим по `data-side` |
| Строки | Нет хардкода: `Sidebar mobileTitle` (обязателен) и `mobileDescription` (необязателен; без него у Sheet нет `aria-describedby`), `SidebarTrigger aria-label` (обязателен; `children` заменяют иконку), `SidebarRail aria-label` (обязателен, дублируется в `title`) |
| Иконка | Триггер — `Icon` с `RiSideBarLine`; иконка добавлена в `mirroredIcons` (показывает сторону панели) |
| Тень `SidebarInset` | Для `inset` — `md:peer-data-[variant=inset]:shadow-inset` (токен `--elevation-inset`, как `shadow-sm` в shadcn `sidebar-08`), одинаковая в обеих темах; остальные `shadow-sm` в `sidebar.tsx` не менялись (решение Кирилла 2026-11-06) |
| Ограничение | Отступ `SidebarInset` для `inset` рассчитан на сайдбар со стороны start (`ms-0`), как в пресете |

**Breadcrumb** (`breadcrumb.tsx`): `aria-label` у `Breadcrumb` обязателен (строка из i18n); разделитель-шеврон — через `Icon` (зеркалится в RTL); у `BreadcrumbEllipsis` убран `sr-only` «More» (элемент `aria-hidden`, доступное имя даёт кнопка-обёртка).

**Button** — вариант `whatsapp` (`bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90`), фокус и размеры — общие пресета. Текст белый, контраст 3.01:1 (с 2026-11-11) — исключение из AA по решению Кирилла 2026-11-06 (§4). Использование: `<Button variant="whatsapp" asChild><a …><Icon icon={RiWhatsappFill} />…</a></Button>`. Повторный `shadcn add button` покажет этот вариант как отличие — не перезаписывать.

**Wordmark** — вариант `variant="dot"` (решение Кирилла 2026-11-06, логотип сайдбара): «tadum» строчными, Geist bold (700), в конце точка `text-primary dark:text-muted-foreground`. Строчные — через CSS `lowercase`, поэтому доступный текст остаётся «Tadum»; точка `aria-hidden`. Вид по умолчанию (D-052, экраны входа) не изменён. Цвет точки в тёмной теме (решение Кирилла 2026-11-06): `--primary` на `--sidebar` давал 1.96:1 — точка почти не видна, поэтому в `.dark` она светло-серая, существующий токен пресета `--muted-foreground` (новый токен не вводился): ≈7.1:1 к `--sidebar` и 8.07:1 к `--background` (`pnpm run check:contrast`). `--sidebar-foreground` не выбран — он почти белый, как само слово, и точка не читалась бы отдельным акцентом. Точка декоративная, AA для неё не требуется, но запас есть.

**ThemeToggleIcon** (`icon/theme-toggle-icon.tsx`, решение Кирилла 2026-11-06) — иконка кнопки темы, как `ModeSwitcher` на ui.shadcn.com: Tabler Icons `brightness` (MIT) — круг и половина со штриховкой. В Remix Icon такой нет; компонент имеет тип `RemixiconComponentType`, поэтому рисуется через `<Icon icon={ThemeToggleIcon} />`. Нейтральная, в `mirroredIcons` не входит.

**Скругления** — значения пресета (решение Кирилла 2026-11-06, правки радиусов откатаны), кроме двух решений Кирилла 2026-11-09:

| Что | Радиус | Где |
| :--- | :--- | :--- |
| Все кнопки портала | `rounded-lg` (= `--radius`), как кнопка «Email» блока помощи; вместо пилюли пресета `rounded-4xl` | база `buttonVariants` в `button.tsx` — единый для всех `size` (включая `xs`, `icon-*`) и вариантов; `AlertDialogAction`/`AlertDialogCancel` и крестики окон берут его через `Button`/`buttonVariants` |
| Модальные окна | `rounded-xl`, как строки-карточки документов | `DialogContent`, `AlertDialogContent`, `DrawerContent` (`before:rounded-xl`); `ResponsiveDialog` своего радиуса не задаёт и наследует их. `Sheet`, `Popover`, `DropdownMenu` — по пресету |

Повторный `shadcn add button|dialog|alert-dialog|drawer` покажет эти радиусы как отличие — не перезаписывать.

**Тени и курсор выпадающих списков** (решения Кирилла 2026-11-09, действуют всегда):

- Тосты (`sonner.tsx`, `toastOptions.classNames.toast`) используют тень выпадающих списков — `shadow-2xl ring-1 ring-foreground/5 dark:ring-foreground/10`, как `DropdownMenuContent`. Собственные тень и граница 1px sonner сняты (`shadow-2xl!`, `border-0!` перебивают селектор `[data-sonner-toast][data-styled]`); фокус клавиатуры — `focus-visible:ring-[3px] ring-ring/50`. Новых токенов нет.
- У всех пунктов выпадающих списков кабинета курсор `cursor-pointer` (`DropdownMenuItem`, `CheckboxItem`, `RadioItem`, `SubTrigger`; у неактивных остаётся `pointer-events-none`). Новые меню с пунктами (`select`, `command`, `context-menu`) при установке получают то же.

Повторный `shadcn add dropdown-menu|sonner` покажет это как отличие — не перезаписывать.

Истории: `shared/ui/Sidebar` (`Expanded`, `Collapsed`, `ControlledOpen`, `Mobile`), `shared/ui/Breadcrumb` (`Default`, `WithEllipsis`), `Button/Whatsapp`, `Wordmark/Dot`, `Icon/ThemeToggle` — в матрице AR/EN × light/dark с axe; play-тесты проверяют сторону сайдбара и Sheet по направлению, отсутствие cookie, `onOpenChange`, зеркалирование шеврона и доступный текст словесного знака.

### Экран «Ваши документы» (2026-11-09)

`pnpm dlx shadcn@4.23.0 add item collapsible empty field drawer spinner alert-dialog label` — новые `item`, `collapsible`, `empty`, `field`, `label` (нужен `field`), `drawer` (зависимость `vaul` 1.1.2), `spinner`, `alert-dialog`. Перезапись `button.tsx` и `separator.tsx` CLI предложил и получил отказ. Классы пресета новых файлов внесены в список `SHADCN_GENERATED` в `eslint.config.js` (как у остальных файлов CLI). Новых токенов нет. Адаптация:

| Компонент | Что |
| :--- | :--- |
| `cva` в `item`, `empty`, `field` | `/* @__PURE__ */` |
| `Drawer` | `vaul-drawer-direction` — физическая сторона: CLI превратил `left-0`/`right-0` в `start-0`/`end-0` (в RTL левый Drawer встал бы справа) — возвращены физические с `eslint-disable` и причиной. `DrawerContent dir` — из `Direction.useDirection()` (портал вне дерева). Ручка `w-[100px]` → `w-25` (шкала), `aria-hidden` |
| `Spinner` | `aria-label` обязателен (без хардкода «Loading»); `role="status"` — на обёртке `span`, иконка — через `Icon` (декоративная) |
| `Item`, `Empty`, `Field`, `Label`, `Collapsible`, `AlertDialog` | Без изменений: строк и физических классов нет |

**ResponsiveDialog** (`responsive-dialog.tsx`, проектный, по образцу shadcn `drawer-dialog`): меньше `md` (`useIsMobile`) — `Drawer` снизу, иначе `Dialog`. Части: `ResponsiveDialog` (`open`, `defaultOpen`, `onOpenChange`), `ResponsiveDialogTrigger`, `ResponsiveDialogContent` (`closeLabel` обязателен, `showCloseButton`, `dir`), `ResponsiveDialogHeader`, `ResponsiveDialogTitle`, `ResponsiveDialogDescription`, `ResponsiveDialogFooter`, `ResponsiveDialogClose`. Режим передаётся частям через контекст; `dir` контента — из Radix Direction; у контента `data-mode="drawer" | "dialog"`. Кнопка-крестик (`closeLabel`) — в обоих режимах, и в Drawer на телефоне (Кирилл 2026-11-09); история `ResponsiveDialog/Mobile` (viewport `mobile360`) проверяет режим `drawer` и видимость крестика. `Drawer` (vaul) подключается лениво — динамическим `import()` при первом монтировании корня на телефоне, ради бюджета первого чанка (D-054): у vaul побочный эффект при импорте (вставка CSS), и статический импорт или реэкспорт из `@/shared/ui` затягивал его в первый чанк (+15 kB gzip). Пока чанк грузится, корень — закрытый `Dialog` (триггер виден, окно не мигает), затем открывается `Drawer` с теми же `open`/`defaultOpen`; не загрузился — откат на `Dialog`. Поэтому `Drawer*` не экспортируются из `src/shared/ui/index.ts` — только `ResponsiveDialog*`; `DrawerPortal`/`DrawerOverlay` из `drawer.tsx` наружу не экспортируются.

`ResponsiveDialogContent size="tall"` (Кирилл 2026-11-09, просмотр примера документа): Drawer — от верхнего края (`max(1rem, safe-area-inset-top)`) до низа вместо `mt-24`/`max-h-[80vh]` пресета (классы под `data-size=tall` в `drawer.tsx`), Dialog — `flex flex-col max-h-9/10`; шапка фиксирована, `ResponsiveDialogBody` (`flex-1 min-h-0 overflow-y-auto`, в Drawer `px-4 pb-4`) растягивается и прокручивается. По умолчанию `size="default"` — прежнее поведение; история `ResponsiveDialog/Tall` (`mobile360`) проверяет высоту > 80% окна и прокрутку тела. Новых токенов нет.

**Progress** — исправлен RTL: заливка шла слева и в RTL. Сдвиг индикатора теперь по `Direction.useDirection()` (`translateX(+N%)` в RTL), заливка растёт от начала строки; `value` передаётся в Root (`aria-valuenow`). Play-тест `shared/ui/Progress/Partial`: при 30 % в AR заливка у правого края, в EN — у левого.

Истории: `Item`, `Collapsible`, `Empty`, `Field`, `Label`, `Spinner`, `Progress` — в матрице AR/EN × light/dark; `Drawer`, `AlertDialog`, `ResponsiveDialog` — порталы, как `Dialog`/`Sheet`, одна копия по глобалам тулбара, play проверяет `dir` контента.

### Экран документов клиента (2026-11-10)

Решения Кирилла 2026-11-10. Новые токены движения и свечения — §3. Контраст не менялся (A-019).

**Input** — размер через `cva` (`inputVariants`), проп `size`: `"default"` — прежний `h-9 px-3 py-1 text-base md:text-sm` (существующие вызовы не меняются), `"lg"` — 48 px: `h-12 px-4 py-2 text-base` (отступ и кегль как у `Button size="lg"`). Нативный атрибут `size` (ширина в символах) исключён из пропсов — как у `Button`; в проекте он не использовался. На элементе — `data-size`. Повторный `shadcn add input` покажет это как отличие — не перезаписывать. Истории `Input/Large`, `Input/Sizes`; истории `Input` переведены в матрицу AR/EN × light/dark.

**SpeechBubble** — удалён 2026-11-11: облачка подсказок Кирилл заменил; в строках документов с ошибкой вместо иконки предупреждения — `PulseDot` (§3).

### Обводка панели отправки, точка ошибки, затухание строки (2026-11-11)

Решения Кирилла 2026-11-11. Токены — §3, контраст пресета не менялся (A-019).

**BorderBeam** (`border-beam.tsx`, проектный): пропсы `active?: boolean` (по умолчанию `true`; `false` — ничего не рендерит), `className?`. Ставится последним дочерним элементом в позиционированный контейнер (`relative`, `sticky`, `absolute`) со скруглением `rounded-xl` и обычным `border`: `<div className="relative rounded-xl border …">…<BorderBeam active={ready} /></div>`. Цвет обводки контейнера не меняется (`border-primary` не нужен); скругление контейнера любое — слой его наследует. Свечение выходит за контейнер на `--beam-glow-radius` (2.5rem): `overflow: hidden` у контейнера и ближайших предков его обрежет.

**PulseDot** (`pulse-dot.tsx`, проектный): пропсы `tone?: "rejected"` (единственный, по умолчанию; `bg-status-rejected`), `className?`. Обёртка `relative inline-flex size-2` — размером с точку, кольцо `absolute inset-0` растёт за её пределы (до ≈ 22 px), обёртка его не обрезает. Центрирует потребитель: `flex items-center justify-center` в колонке иконки (`ItemMedia variant="icon"` — без фиксированного размера, по содержимому) или в колонке `size-10` под плиткой файла; предки не должны иметь `overflow: hidden` ближе ≈ 7 px от точки. Декоративная (`aria-hidden`): статус ошибки несёт текст строки.

### Ввод кода ячейками CodeSlots (2026-11-11)

Решение Кирилла 2026-11-11: код OTP — 4 отдельные ячейки с анимацией по компоненту «Code Slots» (https://reactbits.dev/micro/code-slots); механика — из исходника, вид — токены shadcn. Новых токенов нет, A-019 не затронут. Зависимость — `motion` (только чанк экрана кода).

**CodeSlots** (`code-slots.tsx`, проектный): пропсы `length` (4), `value`, `defaultValue`, `onChange`, `onComplete` (один раз, когда ряд заполнен), `status` (`idle` | `error` | `success`), `disabled`, `autoFocus`, `className`, a11y скрытого поля `id`, `aria-labelledby`, `aria-describedby`, `aria-invalid` (по умолчанию `status === 'error'`), `aria-busy`, `ref` на скрытое поле; параметры движения `bounce`, `settle`, `rise`, `cascade`, а также `mask`, `caret`.

- Вид: ячейка `size-14 rounded-lg border border-input bg-input/30`, зазор `gap-3`; активная — `border-ring ring-3 ring-ring/50`; error — `border-destructive ring-destructive/20` (тёмная — `/50` и `/40`, как у `Input`); заливка заполненной ячейки — `bg-primary/10`, при error — `bg-destructive/15`; цифра `text-2xl font-semibold text-foreground tabular-nums`; каретка `bg-foreground` (`animate-caret-blink`); success — заливка ряда `bg-primary text-primary-foreground` и галочка `RiCheckLine`.
- Сдвиги каретки, подъёма цифры и галочки — в шагах `--spacing` и %, без px; пружины и задержки `motion` — константы в секундах.
- Скрытое поле: `type="text"`, `inputMode="numeric"`, `autoComplete="one-time-code"`, `pattern="[0-9]*"`, без `maxLength`; ряд всегда `dir="ltr"`. Цифры `٠–٩` и `۰–۹` приводятся к западным, вставка берёт только цифры.
- `status="error"` — «осушение» ячеек справа налево, затем компонент сам вызывает `onChange('')`; `status="success"` — заливка ряда и галочка, ввод не принимается. reduced-motion — без анимации.
- Тексты (подпись, ошибки) — в форме (`features/verify-otp`), компонент строк не содержит. Истории — `shared/ui/CodeSlots`: Empty, Typing, Keyboard, Paste, ArabicDigits, ErrorClears, Invalid, Success, Success (static), Disabled.

## 5. Шрифты

Латиница — Geist из пресета (совпадает с D-004), арабский — всегда IBM Plex Sans Arabic. Фактические имена семейств пакетов: `"Geist Variable"` и `"IBM Plex Sans Arabic"` (A-016). `:lang(ar)` — интерлиньяж тела 1.625, заголовков 1.3. Словесный знак `Wordmark` — всегда Geist латиницей: по умолчанию 600 «Tadum» (D-052), в сайдбаре — `variant="dot"`, 700 «tadum.» (§4a). Тест истории `shared/ui/Typography/Fonts` проверяет `document.fonts.check` для обоих семейств и что арабский текст не падает в системный шрифт.

## 6. Иконки

Пресет задаёт Remix Icon вместо `lucide-react` из `01-nfr-locale-brand.md` §3.1 и ADR-002 — по D-077 действует пресет (A-015). Обёртка `Icon` (`src/shared/ui/icon/`): в RTL зеркалятся только иконки из списка `mirroredIcons` (стрелки, шевроны, назад/вперёд, вход/выход, отправка); тест истории `shared/ui/Icon` проверяет, что в `ar` стрелка и шеврон зеркалятся, а часы — нет. Исключение из Remix — `ThemeToggleIcon` (Tabler `brightness`, MIT, §4a) с той же сигнатурой props.

## 7. Тема

`src/shared/lib/theme.tsx`: `system | light | dark`, по умолчанию `light` — всегда светлая, даже при тёмной теме системы (Кирилл 2026-11-11, A-062; раньше `system` по D-025), хранение — `storage('theme')`, класс `.dark` на `<html>`, `<meta name="theme-color">` для обеих тем (`#ffffff` / `#090b0c` = `--background` пресета). Вспышки нет: `index.html` ставит `.dark` до загрузки бандла.

Кнопка темы в шапке кабинета (Кирилл 2026-11-06): `ThemeToggle` (`widgets/theme-switch`) — ghost-кнопка с `ThemeToggleIcon`, как ModeSwitcher на ui.shadcn.com: светлая ↔ тёмная от видимой темы; стоит в конце шапки после переключателя языка, через вертикальный `Separator`. Выбор «Как в системе» — в настройках (`ThemeSwitch`). Кнопки блока помощи «Have a question?» (`SupportCard`) — `rounded-lg`; с 2026-11-09 это радиус всех кнопок (§4a, «Скругления»).

## 8. Запрет сырых значений

- ESLint (`no-restricted-syntax`): в `className` — hex, `rgb()/hsl()/oklch()`, `px`, `ms`, произвольные значения `[..]`; в `style` — цвета, px, мс и числа. Не применяется к 22 файлам shadcn, которые записал CLI (классы — часть пресета).
- ESLint `rtl-friendly/no-physical-properties`: только логические классы.
- Stylelint: hex и цветовые функции запрещены во всех CSS, кроме `tokens.css`.

## 9. Скриншоты

Экран входа и карточки в AR/EN × light/dark — после блока 6d.

## 10. Как менять

Новый пресет — от Кирилла; коммит `design: apply preset …` через субагента `design-system-owner` (появится в блоке 8a): перезапуск `shadcn init` с новым пресетом, перенос токенов в часть 1 `tokens.css`, `pnpm check:contrast`, обновление этого документа.
