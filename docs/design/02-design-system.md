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
| `--status-done` | oklch(0.6 0.17 150) ≈ `#009B44` | = светлой | зелёный «готово» (решение Кирилла 2026-11-11): галочки пройденных шагов шкалы заявки и заливка кнопки WhatsApp — один тон. Светлее прежней галочки `--status-approved` (0.47), тон WhatsApp. Только графика (1.4.11, ≥ 3:1): на `--secondary` 3.33, на `--background` 3.67, в тёмной теме на `--background`/`--secondary`/`--card` 5.38/4.06/4.74. Текст «принято» остаётся `--status-approved` (AA). Класс — `text-status-done`, `bg-status-done` |
| `--whatsapp` | `var(--status-done)` | = светлой | зелёный WhatsApp = `--status-done` с 2026-11-11 (до этого oklch(0.65 0.17 149.7) — тон фирменного `#25D366` со светлотой 0.65). Одинаков в обеих темах (2026-11-06) |
| `--whatsapp-foreground` | oklch(1 0 0) — белый | = светлой | белый текст бренда — 3.67:1 на `--whatsapp` с 2026-11-11 (было 3.01:1 и 1.98:1 на `#25D366`; не AA); Кирилл осознанно принимает исключение (решение 2026-11-06), до этого был тёмный `--foreground` (9.94:1) |
| `--elevation-sm/md` | тени с цветом `--foreground` 6 % и 8 % | `none` (в тёмной теме — границы) | §3.3 |
| `--elevation-inset` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | = светлой | значение `shadow-sm` Tailwind/shadcn; тень контейнера контента `SidebarInset`, как в `sidebar-08` (решение Кирилла 2026-11-06). `--elevation-sm` слабее и в тёмной теме `none`, поэтому тени не было видно. Класс — `shadow-inset` |
| `--motion-fast/base/slow` | 120 / 200 / 320 ms | — | §3.3; при `prefers-reduced-motion` — 0ms |
| `--ease-standard` | cubic-bezier(0.2, 0, 0, 1) | — | §3.3 |
| `--motion-bounce` | 480 ms | — | лёгкий отскок (экран документов клиента, решение Кирилла 2026-11-10); при `prefers-reduced-motion` — 0ms, как остальные `--motion-*`. Класс — `duration-bounce` |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | — | кривая с перелётом ≈ 10 % (2026-11-10). Класс — `ease-bounce` |
| `--motion-pulse` / `--motion-pulse-rest` | 1200 / 1000 ms | — | расхождение кольца `PulseDot` и пауза (2026-11-11). Доля пульса (54.5 %) зашита в `@keyframes pulse-ring`. В reduced-motion кольцо скрыто утилитой |
| `--ease-pulse` | cubic-bezier(0, 0, 0.2, 1) | — | замедление к концу: кольцо быстро отходит от точки и мягко гаснет |
| `--text-fade-length` | 1.75rem | — | зона затухания `text-fade-end` (2026-11-11) |
| `--metal-deep` | oklch(0.22 0.09 268) | oklch(0.17 0.07 268) | глубокий тёмно-синий `MetalCard` (низ справа): тон `--primary` пресета, низкая светлота |
| `--metal-mid` | oklch(0.448 0.22 264.6) = `color-mix(in oklab, --primary 85 %, --metal-deep)` | `var(--primary)` (переобъявлен) | середина основы. В светлой — защитное притемнение под текстом (раунд 3): даёт запас контраста под большой блик. Значение вычислено заранее: сборка подставила бы браузерам без `color-mix` чистый `--primary` |
| `--metal-steel` | oklch(0.4 0.1 238) | oklch(0.4 0.1 238) | сталь/лазурь (верх слева, сторона света). В светлой 0.45 → 0.4 (раунд 3): светлый верх даёт большой блик. Заменил `--metal-tint` |
| `--metal-sheen` / `--metal-sheen-soft` | `--primary-foreground` / 8 %, 5 % | 9 %, 5 % | широкая мягкая полоса отлива 115° (пик и плечи на половине ширины). Тонкая линия шлифовки (`--metal-sheen-line*`) удалена в раунде 3 — читалась как «несколько тонких бликов» |
| `--metal-glare` / `--metal-glare-soft` | `--primary-foreground` / 18 %, 8 % | = светлой | большой рассеянный блик по верху («серое стекло», раунд 3): пик в центре эллипса, середина на 45 % радиуса, к 100 % — прозрачный |
| `--metal-glare-size` / `--metal-glare-x` / `--metal-glare-y` | 110 % 85 % / 30 % / −15 % | — | эллипс блика (доли ширины и высоты) и центр — выше верхнего края: светлее всего верх, к середине блик сходит на нет |
| `--metal-glow` | oklch(0.8 0.09 232 / 4 %) | = светлой | встречное свечение светлой лазури — в точке, зеркальной указателю (эллипс 70 % × 55 %) |
| `--metal-blob-a` / `--metal-blob-a-size` / `--metal-blob-a-x` / `--metal-blob-a-y` | лазурь oklch(0.85 0.06 236 / 5 %) / 55 % 50 % / 20 % / 75 % | = светлой | мягкое пятно фона снизу слева (раунд 3) |
| `--metal-blob-b` / `--metal-blob-b-size` / `--metal-blob-b-x` / `--metal-blob-b-y` | `--primary-foreground` / 4 % / 45 % 60 % / 85 % / 20 % | = светлой | мягкое светлое пятно сверху справа (раунд 3) |
| `--metal-smoke` / `--metal-smoke-soft` | oklch(0.14 0.07 268 / 30 %), / 20 % | oklch(0.1 0.05 268 / 40 %), / 28 % | дымчатые тёмные зоны внизу (эллипсы 70 % × 50 % у 70 % / 105 % и 50 % × 45 % у 15 % / 110 %; геометрия — в утилите). Только темнят |
| `--metal-hotspot` | `--primary-foreground` / 5 % | / 6 % | горячая точка у указателя (раунд 3: 7 → 5 %, 9 → 6 % — яркость теперь даёт большой блик) |
| `--metal-vignette` | oklch(0.14 0.07 268 / 35 %) | oklch(0.1 0.05 268 / 45 %) | затемнение к краям (только темнит, контраст не ухудшает) |
| `--metal-sheen-width` | 30 % | — | полуширина полосы отлива (доля диагонали; было 18 %) |
| `--metal-hotspot-size` | 11rem | — | радиус горячей точки (rem — одинаков у широкой и высокой карточки). Заменил `--metal-glow-radius` |
| `--metal-glare-shift` / `--metal-blob-a-shift` / `--metal-blob-b-shift` / `--metal-smoke-shift` | 0.2 / 0.35 / −0.25 / −0.15 | — | параллакс: доля смещения указателя от центра, на которую сдвигается слой (знак — направление). Встречное свечение — полный ход против указателя |
| `--metal-rim-width` | 1.5px | — | толщина кольца-обводки (и `outline` в forced-colors). Ревью Кирилла 2026-11-11: сначала вдвое тоньше (2px → 1px), затем «чуть увеличь» — 1px → 1.5px |
| `--metal-rim-light` / `--metal-rim-mid` / `--metal-rim-dark` | oklch(0.95 0.03 236 / 95 %), лазурь / 30 %, oklch(0.12 0.06 268 / 80 %) | oklch(0.88 0.05 236 / 85 %), = светлой, почти чёрный / 85 % | градиент кольца 135°: светлое сверху слева, тёмное снизу справа — объём |
| `--metal-rim-glint` / `--metal-rim-glint-size` | `--primary-foreground` (непрозрачный) / 8rem | — | искра на кольце у указателя |
| `--metal-edge` | inset 1px сверху `--primary-foreground`/22 %, снизу глубокий синий/45 % | = светлой | внутренняя кромка поверхности |
| `--metal-shadow` | две тени глубокого синего 55 % / 30 % | чёрная 70 % + синий 50 % | мягкая синяя тень |
| `--metal-tilt-max` / `--metal-perspective` | 7deg / 56.25rem | — | верхний предел наклона по оси (у оригинала 12deg — для нас много) и перспектива обёртки = дистанция взгляда шейдера (900px, как `VIEW_DISTANCE` оригинала). Карточка поворачивается целиком; сглаживание — пружина в компоненте |
| `--metal-tilt-overshoot` | 0.25rem | — | предел выхода края за ячейку при наклоне (ревью Кирилла 2026-11-11: широкая карточка вылезала на панель шагов). Компонент от размера карточки подбирает углы по осям: сначала каждую отдельно, затем общий множитель для угла (обе оси сразу) — точная проекция четырёх углов при перспективе. Маленькая карточка наклоняется до `--metal-tilt-max`, широкая меньше (651 × 278 — ≈ 2.2° / 1.0°). Углы пишутся в `--metal-tilt-x` / `--metal-tilt-y` (CSS-наклон) и передаются шейдеру — совпадают |
| `--metal-gl-highlight` | oklch(0.96 0.03 236) | — | цвет света WebGL-поверхности (полоса, ореол, ядро, свет на фаске) — почти белый с лёгким холодным оттенком |
| `--metal-gl-shine` / `--metal-gl-halo` / `--metal-gl-hotspot` | 0.45 / 0.12 / 0.15 | — | непрозрачность света одного ключевого источника: диагональной полосы софтбокса, её широкого ореола и едва заметного ядра в середине полосы (ревью Кирилла 2026-11-11: вместо блика за курсором и отдельных зон — один понятный свет). Заменили `--metal-gl-glare`, `--metal-gl-glare-size`, `--metal-gl-rest-glare` |
| `--metal-gl-bevel` / `--metal-gl-rim` | 0.28125rem / 0.9 | — | ширина фаски-кромки (4.5px; у оригинала 3px). Ревью Кирилла 2026-11-11: сначала вдвое тоньше (0.375rem → 0.1875rem), затем «чуть увеличь» — в 1.5 раза, 0.1875rem → 0.28125rem. Сила света на ней сверху слева; снизу справа фаска темнеет |
| `--metal-gl-rough` | 0.15 | — | шлифовка: слабая горизонтальная «щётка» (у оригинала 0.3). Рябь (`--metal-gl-warp`) убрана — делала свет хаотичным |
| `--metal-gl-contrast` | 4.75 | — | целевой контраст белого текста: потолок яркости поверхности = (L(`--primary-foreground`) + 0.05) / 4.75 − 0.05, запас над 4.5 на сглаживание и дизеринг. Ограничивает непрозрачность бликов (мягкое колено на 60 % допустимой), а не цвет; без зависимости от положения — без локальных затемнений |
| `--folder-back` | oklch(0.8 0.09 264) | oklch(0.74 0.11 262) | задняя стенка папки-анимации над кнопкой отправки на активной синей панели (решение Кирилла 2026-11-12). Тон синего пресета, заметно светлее `--primary`, темнее передней стенки. Непрозрачный: половина папки выступает за верх панели над фоном страницы. На `--primary` 3.6 / 3.8:1, на фоне страницы 1.9 / 8.5:1 (светлая / тёмная). Классы `bg-folder-back`, `fill-folder-back` |
| `--folder-front` | oklch(0.93 0.035 264) | oklch(0.87 0.055 262) | передняя стенка — между `--status-received-muted` и `--folder-back`; на `--primary` 5.5 / 6:1. Классы `bg-folder-front`, `fill-folder-front` |
| `--folder-paper` | oklch(0.985 0.006 264) | oklch(0.97 0.014 254.604) = `--primary-foreground` | листы без текста, почти белые в обеих темах (в тёмной не темнеют); на `--primary` 6.5 / 8.1:1. Классы `bg-folder-paper`, `fill-folder-paper`. Папка декоративная (`aria-hidden`), пары в `check:contrast` не входят |
| `--primary-inverse` / `--primary-inverse-foreground` | oklch(1 0 0) / `--primary` | oklch(1 0 0) / `--primary` (переобъявлен в `.dark`) | инверсная кнопка на синей панели `bg-primary` («Send for review», решение Кирилла 2026-11-12): чисто белая непрозрачная заливка вместо голубоватого `--primary-foreground`. Классы `bg-primary-inverse text-primary-inverse-foreground hover:bg-primary-inverse/90`. Пары в `check:contrast` (обязательные): текст на заливке ≥ 4.5, заливка на `--primary` ≥ 3 |
| `--mask-solid` | oklch(0 0 0) | — | непрозрачный цвет для `mask-image` (маска берёт только альфу); нужен, потому что Stylelint запрещает именованные и сырые цвета вне `tokens.css` |

Сопоставление со статусами: документы `needed`→`pending`, `uploaded`→ зелёная палитра `approved` (решение Кирилла 2026-11-10; от `accepted` отличается иконкой `RiCheckLine`), `needs a new file`→`rejected`, `accepted`→`approved`; шкала и чек-лист: `needs_attention`/`failed` = `rejected`; `supplier_view`: `applied`/`collecting_docs`→`pending`, `under_review`→`received`, `approved`/`first_purchase`→`approved`, `closed` → нейтральный `muted` (не `rejected`). Компонент — `StatusBadge` (иконка + текст + цвет).

Классы Tailwind: `bg-whatsapp`, `text-whatsapp-foreground`, `bg-status-pending-muted`, `text-status-received`, `bg-limit-fill`, `shadow-sm`, `shadow-inset`, `duration-base`, `ease-standard`, `duration-bounce`, `ease-bounce`, `animate-pulse-ring`, `text-fade-end`, `font-wordmark`, `bg-folder-back` / `bg-folder-front` / `bg-folder-paper` (и `fill-*`) и т. д.

**`BorderBeam` удалён 2026-11-12** (решение Кирилла: панель отправки в состоянии «всё готово» перекрашивается в `bg-primary` с папкой-анимацией, бегущий блик не нужен). Удалены `border-beam.tsx`, утилиты `border-beam`, `border-beam-edge`, `border-beam-glow`, `@property --beam-p`, `@keyframes border-beam`, токены `--motion-beam*`, `--beam-*`, `--mask-faint`, история `shared/ui/Motion/BorderBeam`.

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
| `--whatsapp-foreground` на `--whatsapp` (белый; с 2026-11-11 = `--status-done`, было 3.01 и 1.98) | 3.67 | 3.67 |

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

**SideDrawer** (`side-drawer.tsx`, проектный; Кирилл 2026-11-11 — панель «Ваши документы» на десктопе): боковая панель shadcn Drawer (vaul) от края inline-end — в LTR справа, в RTL слева. Один компонент без составных частей: `open`, `onOpenChange`, `title`, `description?` (без него нет `aria-describedby`), `closeLabel` (все строки — из i18n), `children` (тело), `className` (например, ширина), `dir?`. Физическая сторона (`direction` vaul, `side` Sheet) выводится из `Direction.useDirection()`; порталу передаётся явный `dir`. Ширина — `w-full`, на ≥ `sm` — `max-w-xl` (36rem), переопределяется `className`; высота — всё окно; шапка (заголовок, описание, `pe-12` под крестик) фиксирована, тело (`data-slot="side-drawer-body"`, `flex-1 min-h-0 overflow-y-auto`) прокручивается; крестик — ghost `icon-sm`, `RiCloseLine` через `Icon`, в углу top-end, как у `ResponsiveDialogContent`. vaul грузится лениво при монтировании — общий загрузчик `lazy-drawer.ts` (его же использует `ResponsiveDialog`); пока грузится или не загрузился — та же панель на `Sheet` с той же стороны (`data-mode="sheet" | "drawer"`). Открытая как Sheet панель остаётся Sheet до закрытия (содержимое не монтируется заново). Чтобы ширину задавал `className`, у `DrawerContent` и `SheetContent` появился проектный проп `customWidth`: с ним ширина пресета для боковых сторон (`w-3/4`, `sm:max-w-sm`) не применяется (иначе классы с `data-[…]` перебивали бы ширину по специфичности). Истории `shared/ui/SideDrawer` — `ArLight`, `EnLight`, `ArDark`, `EnDark` (портал: одна копия на историю, глобалы языка и темы; viewport `desktop1280`) и `OpensAsDrawer` (открытие после загрузки vaul): play проверяет край inline-end, `dir`, ширину ≤ 36rem, высоту окна, подпись крестика, прокрутку тела, `data-vaul-drawer-direction`; axe — без нарушений. Новых токенов нет.

**Progress** — исправлен RTL: заливка шла слева и в RTL. Сдвиг индикатора теперь по `Direction.useDirection()` (`translateX(+N%)` в RTL), заливка растёт от начала строки; `value` передаётся в Root (`aria-valuenow`). Play-тест `shared/ui/Progress/Partial`: при 30 % в AR заливка у правого края, в EN — у левого.

Истории: `Item`, `Collapsible`, `Empty`, `Field`, `Label`, `Spinner`, `Progress` — в матрице AR/EN × light/dark; `Drawer`, `AlertDialog`, `ResponsiveDialog` — порталы, как `Dialog`/`Sheet`, одна копия по глобалам тулбара, play проверяет `dir` контента.

### Экран документов клиента (2026-11-10)

Решения Кирилла 2026-11-10. Новые токены движения и свечения — §3. Контраст не менялся (A-019).

**Input** — размер через `cva` (`inputVariants`), проп `size`: `"default"` — прежний `h-9 px-3 py-1 text-base md:text-sm` (существующие вызовы не меняются), `"lg"` — 48 px: `h-12 px-4 py-2 text-base` (отступ и кегль как у `Button size="lg"`). Нативный атрибут `size` (ширина в символах) исключён из пропсов — как у `Button`; в проекте он не использовался. На элементе — `data-size`. Повторный `shadcn add input` покажет это как отличие — не перезаписывать. Истории `Input/Large`, `Input/Sizes`; истории `Input` переведены в матрицу AR/EN × light/dark.

**SpeechBubble** — удалён 2026-11-11: облачка подсказок Кирилл заменил; в строках документов с ошибкой вместо иконки предупреждения — `PulseDot` (§3).

### Обводка панели отправки, точка ошибки, затухание строки (2026-11-11)

Решения Кирилла 2026-11-11. Токены — §3, контраст пресета не менялся (A-019).

**BorderBeam** — удалён 2026-11-12 (§3).

**PulseDot** (`pulse-dot.tsx`, проектный): пропсы `tone?: "rejected"` (единственный, по умолчанию; `bg-status-rejected`), `className?`. Обёртка `relative inline-flex size-2` — размером с точку, кольцо `absolute inset-0` растёт за её пределы (до ≈ 22 px), обёртка его не обрезает. Центрирует потребитель: `flex items-center justify-center` в колонке иконки (`ItemMedia variant="icon"` — без фиксированного размера, по содержимому) или в колонке `size-10` под плиткой файла; предки не должны иметь `overflow: hidden` ближе ≈ 7 px от точки. Декоративная (`aria-hidden`): статус ошибки несёт текст строки.

### Сегментированный прогресс и папка панели отправки (2026-11-12)

Решения Кирилла 2026-11-12. Токены папки — §3, контраст пресета не менялся (A-019).

**SegmentedProgress** (`segmented-progress.tsx`, проектный): ряд сегментов — по сегменту на документ и поле CR. Пропсы `segments: readonly boolean[]` (заполнен ли сегмент, по порядку от начала строки), `tone?: "default" | "inverse"`, `className?` и атрибуты `div` (подпись — `aria-label` или `aria-labelledby`, текст значения — `aria-valuetext`, задаёт потребитель). Корень — `role="progressbar"`, `aria-valuemin=0`, `aria-valuemax` = числу сегментов, `aria-valuenow` = числу заполненных. Сегменты `h-2 flex-1 rounded-full`, зазор `gap-1` (ниже `Progress` `h-3`); цвет — `transition-colors duration-slow ease-standard`. `default`: пустой `bg-muted`, заполненный `bg-primary`; `inverse` (на `bg-primary` панели): пустой `bg-primary-foreground/25`, заполненный `bg-primary-foreground`. RTL: только flex-порядок, физических свойств нет — в AR первый сегмент справа. Истории `shared/ui/SegmentedProgress/*` (Partial с play: ARIA и порядок в AR/EN; Empty, Full, Inverse, FolderTokens — образцы цветов папки на `bg-primary` и `bg-background`).

### Металлическая карточка MetalCard (2026-11-11)

Решение Кирилла 2026-11-11. С раунда 3 ревью (Кирилл подтвердил: WebGL — основная реализация) поверхность — **WebGL2-порт React Bits «Reflective Card»** (https://reactbits.dev, репозиторий DavidHDev/react-bits, автор David Haz; лицензия MIT + Commons Clause — по описанию проекта, сверить с LICENSE.md репозитория не удалось: сеть песочницы закрыта). Атрибуция — в шапке `metal-card-gl.ts`. Камера и видео не используются (песочница просмотрщика запрещает камеру): металл отражает процедурную «комнату» и софтбоксы. CSS-слои — запасной вариант. Токены `--metal-*` — §3, контраст пресета не менялся (A-019).

**WebGL-поверхность** (`metal-card-gl.ts`, ленивый модуль — в первый чанк не попадает; новых зависимостей нет, чистый WebGL2 как у оригинала). Из оригинала взяты плита с фаской, отражение через матрицу наклона, полосы с мягким краем (erf) и шлифовка; проходы CAPTURE/BLUR, видео и камера убраны. Свет (ревью Кирилла 2026-11-11: «блик — хаотичное пятно», «на широкой карточке два несвязанных света»): **один ключевой источник сверху слева**, неподвижный в пространстве комнаты. Его отражение — одна диагональная полоса софтбокса под −35° с мягкими краями (`--metal-gl-shine`), широкий ореол той же полосы (`--metal-gl-halo`, им же чуть светлеет металл) и едва заметное ядро в её середине (`--metal-gl-hotspot`). Всё считается по отражённому лучу, поэтому при наклоне полоса скользит по плите, как отражение неподвижной лампы; за курсором ничего не ходит. Геометрия — в долях половины короткой стороны: у широкой и высокой карточки полоса одной толщины, центр в покое привязан к верхнему левому углу. Убраны блик за указателем, рябь, вторичные полосы и «комната». Основа — синий металл: градиент 330° `--metal-deep → --metal-mid → --metal-steel`. Свет ложится экранным смешением (screen) к `--metal-gl-highlight` — чистый свет поверх синего, без серого сжатия. Яркость при screen растёт линейно с непрозрачностью, поэтому потолок из `--metal-gl-contrast` ограничивает непрозрачность света: она мягко (колено на 60 %) подходит к наибольшей допустимой для данной точки. Ограничение не зависит от положения текста — без локальных затемнений. Фаска согласована с тем же светом: светлая сверху слева, тёмная снизу справа. Предел физический: при фиксированной яркости добавленный свет снижает насыщенность синего, поэтому самая яркая часть полосы светло-голубая, а не белая. Цвета токенов читаются в рантайме (2D-canvas, любой синтаксис — oklch, color-mix) и перечитываются при смене класса или стиля `<html>` (тема). Пружина наклона и указателя — как у оригинала (жёсткость 120, демпфирование 16), Вступительной анимации нет. Указатель меряется по прямоугольнику статичного корня. `prefers-reduced-motion` и сенсорные экраны (`hover: none` / `pointer: coarse`) — без наклона, один статичный кадр с полосой в положении покоя (касание не обрабатывается). Нет WebGL2, шейдер не собрался, контекст потерян или модуль не загрузился — остаются CSS-слои (атрибут `data-gl` снят).

**MetalCard** (`metal-card.tsx`, проектный): пропсы `as?: "div" | "section" | "article" | "aside" | "li"` (по умолчанию `div`), `className?` и атрибуты HTML-элемента; свои `onPointerMove`/`onPointerLeave` вызываются. Скругление `rounded-2xl` (как у `Card`), отступ по умолчанию `p-6` — переопределяется `className`. Работает в любой пропорции: ширина и высота — от раскладки (например, вертикальная ≈ 1:1.2, растянутая сеткой).

Устройство (доработки по ревью Кирилла 2026-11-11, раунд 3): корень — **статичная обёртка**: держит место, содержимое и обработчики указателя и никогда не трансформируется. Раньше наклонялся сам элемент с обработчиком — у углов его область наведения сдвигалась, карточка дёргалась и «терялась». Первый прямой ребёнок — `canvas[data-slot=metal-card-gl]` (`aria-hidden`, под содержимым); карточка поворачивается целиком: CSS-слои, canvas и содержимое (все прямые дети) — на один угол с общей перспективой обёртки, `backface-visibility: hidden`, без масштаба и `translateZ` (в покое текст чёткий). Слои (`@utility metal-card` в `globals.css`; при `data-gl` фон `::before` снят, кромка, тень и кольцо остаются):

- `::before` — поверхность. Снизу вверх: основа `linear-gradient(330deg, --metal-deep, --metal-mid 50 %, --metal-steel)` (тёмный низ справа → светлый верх слева); две дымчатые тёмные зоны `--metal-smoke`/`--metal-smoke-soft` у нижнего края; пятна фона — встречное свечение `--metal-glow` (зеркально указателю), `--metal-blob-a` снизу слева и `--metal-blob-b` сверху справа; широкая мягкая полоса отлива `--metal-sheen` (115°, позиция — среднее координат указателя); большой рассеянный блик `--metal-glare` по верху; горячая точка `--metal-hotspot` у указателя; виньетка `--metal-vignette`. Блик, пятна и дым сдвигаются за указателем каждый на свою долю (`--metal-*-shift`, разные знаки) — параллакс слоёв друг относительно друга. `box-shadow` — `--metal-edge`, `--metal-shadow`.
- `::after` — кольцо толщиной `--metal-rim-width` (1.5px): маска `content-box` ⊕ `border-box` (`mask-composite: exclude`), фон — градиент `--metal-rim-light → --metal-rim-mid → --metal-rim-dark` и искра `--metal-rim-glint` у указателя. Скругление наследуется.
- Прямые дети (`.metal-card > *`) — canvas и содержимое: тот же `rotateX/rotateY`, что у слоёв; перспектива — свойство `perspective` обёртки (общая точка схода).
- `forced-colors: active` — слои скрыты, граница `outline` системным `CanvasText`.

Наведение: на `pointerenter`/`pointermove` (только `pointerType === "mouse"`, `hover: hover`, `pointer: fine`, без reduced-motion) модуль по прямоугольнику обёртки задаёт цели пружин наклона (−1…1, без мёртвой зоны — дрожание гасит пружина) и указателя; каждый кадр пишет `--metal-rx`/`--metal-ry` и `--metal-x`/`--metal-y` (0…100 %) — их читают CSS-слои (запасной вариант) и наклон. Переходов CSS нет. На `pointerleave` цели — 0 и положение покоя (30 % / 20 %). Наклон `rotateX(ry · --metal-tilt-x) rotateY(−rx · --metal-tilt-y)` — угол под указателем выходит к зрителю; пределы осей считаются от размера карточки (`--metal-tilt-overshoot`), перелёт пружины за ±1 в наклон не попадает. Масштаба и `translateZ` при наведении нет. Вне этих условий трансформаций нет, блики статичны. Наклон — по физической позиции указателя, одинаково в RTL и LTR.

Текст: `--primary-foreground` (класс по умолчанию у карточки) без прозрачности. WebGL-поверхность: общий потолок яркости; замер в Chromium (страница `/c/documents`, персона `client_offer_pending`, ar/en × light/dark, указатель в покое и в сетке 5 × 5 по карточке, максимум яркости фона под каждой строкой текста при скрытом тексте): худший контраст 4.68:1 (мелкий и крупный текст, обе темы; диапазон 4.68–4.69). Фаска и кольцо шире с 2026-11-11 (4.5px и 1.5px): свет фаски добавляется после потолка, но только в полосе шириной `--metal-gl-bevel` у края — внутри отступа `p-6` (1.5rem), под текст не попадает; формула потолка не менялась, поэтому замер под текстом остаётся в силе (≥ 4.68:1 > 4.5). CSS-слои (запасной вариант): сумма пиков всех светлых слоёв в одной точке дала бы < 4.5, но геометрически они не совпадают, поэтому худший контраст считается по геометрии (раунд 3): сетка 25 × 25 точек карточки × положения указателя с шагом 10 % × 4 пропорции (384 × 220, 640 × 300, 280 × 336, 360 × 200), градиенты в oklab, наложение в sRGB. Белый текст: светлая — 4.82:1, тёмная — 4.88:1; без затемняющих слоёв (дым, виньетка) — 4.72 / 4.65. Худшие точки — верхняя треть у полосы отлива под краем блика. Запас под большой блик дало защитное притемнение основы в светлой теме (`--metal-mid` на 15 % к `--metal-deep`, `--metal-steel` 0.45 → 0.4) и снижение горячей точки; пик блика ограничен 18 %. Прозрачность текста (`/80`) — только для крупного текста (≥ 3:1: 3.70 светлая, 3.76 тёмная). Искра кольца лежит на обводке — под текстом не бывает. Альфы и геометрию бликов не менять без пересчёта. Истории — `shared/ui/MetalCard`: подпись «Лимит», сумма, строка текста; `as="section"`; вертикальная `Tall` в сетке рядом с блоком; `Tilted` — наведение мышью у верхнего правого угла (play отправляет `pointermove`; проверяет знак наклона и трансформацию содержимого).

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
