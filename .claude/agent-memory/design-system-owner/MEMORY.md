# Память design-system-owner

## Варианты компонентов

- **Тон `inverse` для полос прогресса** (`Progress`, `SegmentedProgress`): на синей поверхности (`MetalCard`, `bg-primary`) дорожка `bg-primary-foreground/25`, индикатор `bg-primary-foreground`. Проп `tone?: "default" | "inverse"`, корень с `data-tone`. Новых токенов нет (TD-002, 2026-11-27).
- Контраст inverse-полосы проверяет `check:contrast` (пары с `on` — слои поверхности и `bgOpacity` — модификатор `/N`). Худшее 3.19 (светлая, `--metal-mid` под `--metal-glare`): дорожку светлее /25 не делать; при усилении бликов MetalCard пересчитать.
