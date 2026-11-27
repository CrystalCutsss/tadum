# Память design-system-owner

## Варианты компонентов

- **Тон `inverse` для полос прогресса** (`Progress`, `SegmentedProgress`): на синей поверхности (`MetalCard`, `bg-primary`) дорожка `bg-primary-foreground/25`, индикатор `bg-primary-foreground`. Проп `tone?: "default" | "inverse"`, корень с `data-tone`. Новых токенов нет (TD-002, 2026-11-27).
- Контраст inverse-полосы проверяет `check:contrast` (пары с `on` — слои поверхности и `bgOpacity` — модификатор `/N`). Худшее 3.19 (светлая, `--metal-mid` под `--metal-glare`): дорожку светлее /25 не делать; при усилении бликов MetalCard пересчитать.
- **Фокус в шторках vaul**: vaul 1.1.x `autoFocus=false` по умолчанию гасит `onOpenAutoFocus` — любой `Drawer.Root` в проекте ставить с `autoFocus` (`ResponsiveDialog`, `SideDrawer`). Проверка — история `ResponsiveDialog/MobileFocus` (TD-002, 2026-11-27).
- **Фокус на `MetalCard`**: обводка `outline-primary-foreground` со смещением для `:focus-visible` потомков — в утилите `metal-card` (`globals.css`), не в `className` (ESLint запрещает `[..]`). Нужен `outline-solid`: `outline-none` пресета ставит `--tw-outline-style: none`. Пары в `check:contrast`, худшее 5.05 (TD-002, 2026-11-27).
