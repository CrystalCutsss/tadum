#!/usr/bin/env bash
# PreToolUse (Bash): опасные и запрещённые команды (мастер-промпт 8b.1, инварианты 9–10, D-068, D-069).
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

input=$(cat)
cmd=$(jq -r '.tool_input.command // empty' <<<"$input")
agent=$(jq -r '.agent_type // empty' <<<"$input")
[[ -z "$cmd" ]] && exit 0

# Сегменты команды по ; && || | и переводам строк — проверяем каждый.
mapfile -t parts < <(printf '%s\n' "$cmd" | sed -E 's/(\&\&|\|\||;|\|)/\n/g')

for raw in "${parts[@]}"; do
  part=$(sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' <<<"$raw")
  [[ -z "$part" ]] && continue
  # Префиксы окружения (VAR=x cmd) не меняют смысл команды.
  part=$(sed -E 's/^([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)+//' <<<"$part")

  if [[ "$part" =~ ^git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+push ]]; then
    [[ "$part" =~ (^|[[:space:]])(--force|--force-with-lease|-f)([=[:space:]]|$) ]] && deny "Force-push запрещён."
    [[ "$part" =~ (^|[[:space:]:+])main([[:space:]]|$) ]] && deny "Push в main запрещён: main меняет Кирилл merge-коммитом PR. Proto — только через pnpm run release:proto после его «да»."
  fi

  if [[ "$part" =~ ^git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+commit ]]; then
    dir=$(project_dir)
    [[ "$part" =~ ^git[[:space:]]+-C[[:space:]]+([^[:space:]]+) ]] && dir="${BASH_REMATCH[1]}"
    branch=$(git -C "$dir" symbolic-ref --short -q HEAD 2>/dev/null || true)
    [[ "$branch" == main ]] && deny "Коммит в ветку main запрещён: создайте ветку (CONTRIBUTING.md)."
  fi

  if [[ "$part" =~ ^rm[[:space:]] && "$part" =~ [[:space:]](-[a-zA-Z]*[rR][a-zA-Z]*|--recursive)([[:space:]]|$) ]]; then
    read -ra words <<<"$part"
    for w in "${words[@]:1}"; do
      [[ "$w" == -* ]] && continue
      base=${w%/}; base=${base#./}
      case "$base" in
        dist | node_modules | .wrangler | storybook-static | test-results | playwright-report | .lighthouseci | tests/screenshots) ;;
        *) deny "rm -rf разрешён только для dist, node_modules, .wrangler, storybook-static, test-results, playwright-report, .lighthouseci, tests/screenshots (а не «$w»)." ;;
      esac
    done
  fi

  # Запись в защищённые пути через Bash — те же правила, что у protect-paths.sh для Edit/Write.
  if [[ "$part" =~ (^|[[:space:]])(sed[[:space:]]+(-[a-zA-Z]*i|--in-place)|tee|cp|mv|rm|truncate|perl[[:space:]]+-[a-zA-Z]*i)([[:space:]]|$) || "$part" =~ \>[^\&] ]]; then
    for target in "src/styles/tokens.css" "src/shared/ui/" "docs/product/" "tov-lexicon.json" "src/shared/api/ports/" "pnpm-lock.yaml" ".github/" ".gitlab-ci.yml" "wrangler.jsonc" ".claude/settings.json"; do
      [[ "$part" == *"$target"* ]] || continue
      case "$target" in
        docs/product/ | tov-lexicon.json) [[ "${TADUM_DOCS_SYNC:-0}" == 1 ]] && continue ;;
        src/styles/tokens.css | src/shared/ui/) [[ "$agent" == design-system-owner || "${TADUM_ALLOW_PROTECTED:-0}" == 1 ]] && continue ;;
        *) [[ "${TADUM_ALLOW_PROTECTED:-0}" == 1 ]] && continue ;;
      esac
      deny "Запись в защищённый путь ($target) через Bash запрещена — те же правила, что для Edit/Write (protect-paths.sh)."
    done
  fi

  [[ "$part" =~ ^(pnpm[[:space:]]+(exec[[:space:]]+)?|npx[[:space:]]+)?wrangler[[:space:]]+secret ]] && deny "Секреты ставит только Кирилл (D-068): скажите, где и что поставить."
  [[ "$part" =~ ^gh[[:space:]]+secret ]] && deny "Секреты ставит только Кирилл (D-068): скажите, где и что поставить."

  if [[ "$part" =~ ^(pnpm[[:space:]]+(exec[[:space:]]+)?|npx[[:space:]]+)?wrangler[[:space:]]+deploy ]] && [[ ! "$part" =~ --dry-run ]]; then
    deny "wrangler deploy напрямую запрещён: превью деплоит CI из main, витрину — pnpm run release:proto после «да» Кирилла."
  fi

  [[ "$part" =~ ^pnpm[[:space:]]+release:proto ]] && deny "Публикация — только pnpm run release:proto vN (скилл /release-proto) со всеми остановками."

  if [[ "$part" =~ ^pnpm[[:space:]]+dlx[[:space:]]+shadcn[^[:space:]]*[[:space:]]+add ]] && [[ "$agent" != design-system-owner ]]; then
    deny "Компоненты shadcn добавляет только субагент design-system-owner."
  fi
done
exit 0
