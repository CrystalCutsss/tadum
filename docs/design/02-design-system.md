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
| `--whatsapp` | oklch(0.761 0.201 149.7) | = светлой | фирменный зелёный WhatsApp `#25D366` в oklch; цвет бренда одинаков в обеих темах (решение Кирилла 2026-11-06) |
| `--whatsapp-foreground` | oklch(1 0 0) — белый | = светлой | белый текст бренда на `#25D366` — 1.98:1 (не AA); Кирилл осознанно принимает исключение (решение 2026-11-06), до этого был тёмный `--foreground` (9.94:1) |
| `--elevation-sm/md` | тени с цветом `--foreground` 6 % и 8 % | `none` (в тёмной теме — границы) | §3.3 |
| `--elevation-inset` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)` | = светлой | значение `shadow-sm` Tailwind/shadcn; тень контейнера контента `SidebarInset`, как в `sidebar-08` (решение Кирилла 2026-11-06). `--elevation-sm` слабее и в тёмной теме `none`, поэтому тени не было видно. Класс — `shadow-inset` |
| `--motion-fast/base/slow` | 120 / 200 / 320 ms | — | §3.3; при `prefers-reduced-motion` — 0ms |
| `--ease-standard` | cubic-bezier(0.2, 0, 0, 1) | — | §3.3 |

Сопоставление со статусами: документы `needed`→`pending`, `uploaded`→`received`, `needs a new file`→`rejected`, `accepted`→`approved`; шкала и чек-лист: `needs_attention`/`failed` = `rejected`; `supplier_view`: `applied`/`collecting_docs`→`pending`, `under_review`→`received`, `approved`/`first_purchase`→`approved`, `closed` → нейтральный `muted` (не `rejected`). Компонент — `StatusBadge` (иконка + текст + цвет).

Классы Tailwind: `bg-whatsapp`, `text-whatsapp-foreground`, `bg-status-pending-muted`, `text-status-received`, `bg-limit-fill`, `shadow-sm`, `shadow-inset`, `duration-base`, `ease-standard`, `font-wordmark` и т. д.

## 4. Контраст (WCAG 2.2 AA)

`pnpm check:contrast` (`scripts/check-contrast.mjs`) считает контраст по токенам `tokens.css` в обеих темах. Результат на 2026-11-05 — **все пары Tadum проходят**, кроме принятого исключения WhatsApp (с 2026-11-06):

| Пара | Светлая | Тёмная |
| :--- | ---: | ---: |
| статус на своём `-muted` (бейдж), мин. по 4 статусам | 5.70 | 6.85 |
| `-foreground` на заливке статуса, мин. | 6.12 | 9.83 |
| статус на `--background` / `--card`, мин. | 6.40 | 8.66 |
| `--limit-fill` против `--limit-track` (нужно ≥ 3) | 5.48 | 3.98 |
| `--whatsapp-foreground` на `--whatsapp` (с 2026-11-06; белый) | 1.98 | 1.98 |

Пара WhatsApp не проходит AA (нужно 4.5) и **принята как исключение** решением Кирилла 2026-11-06: белый текст — фирменный вид кнопки WhatsApp. Это осознанное отступление от A-019 только для этой пары; другие пары правило по-прежнему не ослабляют. Сама заливка против светлого фона — 1.9:1: граница кнопки не несёт смысла (у кнопки есть текст и иконка), 1.4.11 не требуется.

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

**Button** — вариант `whatsapp` (`bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90`), фокус и размеры — общие пресета. Текст белый, контраст 1.98:1 — исключение из AA по решению Кирилла 2026-11-06 (§4). Использование: `<Button variant="whatsapp" asChild><a …><Icon icon={RiWhatsappFill} />…</a></Button>`. Повторный `shadcn add button` покажет этот вариант как отличие — не перезаписывать.

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

**Progress** — исправлен RTL: заливка шла слева и в RTL. Сдвиг индикатора теперь по `Direction.useDirection()` (`translateX(+N%)` в RTL), заливка растёт от начала строки; `value` передаётся в Root (`aria-valuenow`). Play-тест `shared/ui/Progress/Partial`: при 30 % в AR заливка у правого края, в EN — у левого.

Истории: `Item`, `Collapsible`, `Empty`, `Field`, `Label`, `Spinner`, `Progress` — в матрице AR/EN × light/dark; `Drawer`, `AlertDialog`, `ResponsiveDialog` — порталы, как `Dialog`/`Sheet`, одна копия по глобалам тулбара, play проверяет `dir` контента.

## 5. Шрифты

Латиница — Geist из пресета (совпадает с D-004), арабский — всегда IBM Plex Sans Arabic. Фактические имена семейств пакетов: `"Geist Variable"` и `"IBM Plex Sans Arabic"` (A-016). `:lang(ar)` — интерлиньяж тела 1.625, заголовков 1.3. Словесный знак `Wordmark` — всегда Geist латиницей: по умолчанию 600 «Tadum» (D-052), в сайдбаре — `variant="dot"`, 700 «tadum.» (§4a). Тест истории `shared/ui/Typography/Fonts` проверяет `document.fonts.check` для обоих семейств и что арабский текст не падает в системный шрифт.

## 6. Иконки

Пресет задаёт Remix Icon вместо `lucide-react` из `01-nfr-locale-brand.md` §3.1 и ADR-002 — по D-077 действует пресет (A-015). Обёртка `Icon` (`src/shared/ui/icon/`): в RTL зеркалятся только иконки из списка `mirroredIcons` (стрелки, шевроны, назад/вперёд, вход/выход, отправка); тест истории `shared/ui/Icon` проверяет, что в `ar` стрелка и шеврон зеркалятся, а часы — нет. Исключение из Remix — `ThemeToggleIcon` (Tabler `brightness`, MIT, §4a) с той же сигнатурой props.

## 7. Тема

`src/app/theme.tsx`: `system | light | dark`, по умолчанию `system` (D-025), хранение — `storage('theme')`, класс `.dark` на `<html>`, `<meta name="theme-color">` для обеих тем (`#ffffff` / `#090b0c` = `--background` пресета). Вспышки нет: `index.html` ставит `.dark` до загрузки бандла.

Кнопка темы в шапке кабинета (Кирилл 2026-11-06): `ThemeToggle` (`widgets/theme-switch`) — ghost-кнопка с `ThemeToggleIcon`, как ModeSwitcher на ui.shadcn.com: светлая ↔ тёмная от видимой темы; стоит в конце шапки после переключателя языка, через вертикальный `Separator`. Выбор «Как в системе» — в настройках (`ThemeSwitch`). Кнопки блока помощи «Have a question?» (`SupportCard`) — `rounded-lg`; с 2026-11-09 это радиус всех кнопок (§4a, «Скругления»).

## 8. Запрет сырых значений

- ESLint (`no-restricted-syntax`): в `className` — hex, `rgb()/hsl()/oklch()`, `px`, `ms`, произвольные значения `[..]`; в `style` — цвета, px, мс и числа. Не применяется к 22 файлам shadcn, которые записал CLI (классы — часть пресета).
- ESLint `rtl-friendly/no-physical-properties`: только логические классы.
- Stylelint: hex и цветовые функции запрещены во всех CSS, кроме `tokens.css`.

## 9. Скриншоты

Экран входа и карточки в AR/EN × light/dark — после блока 6d.

## 10. Как менять

Новый пресет — от Кирилла; коммит `design: apply preset …` через субагента `design-system-owner` (появится в блоке 8a): перезапуск `shadcn init` с новым пресетом, перенос токенов в часть 1 `tokens.css`, `pnpm check:contrast`, обновление этого документа.
