#!/usr/bin/env bash
# PostToolUse (Edit|Write|MultiEdit): быстрая проверка изменённого файла. Файл уже записан —
# замечания уходят Claude (exit 2 + stderr), чтобы он сразу поправил.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
require_jq_or_skip

input=$(cat)
file=$(jq -r '.tool_input.file_path // empty' <<<"$input")
[[ -z "$file" || ! -f "$file" ]] && exit 0
root=$(project_dir)
rel=$(rel_path "$file")
[[ "$rel" == ../* ]] && exit 0
cd "$root"

problems=""

case "$rel" in
  src/*.ts | src/*.tsx | scripts/*.mjs | tests/*.ts | .storybook/*.ts | .storybook/*.tsx)
    # eslint --fix чинит импорты и форматирование; остаток — Claude.
    if ! out=$(pnpm exec eslint --fix --max-warnings=0 --no-warn-ignored "$rel" 2>&1); then problems+=$'ESLint:\n'"$out"$'\n'; fi
    ;;
esac

case "$rel" in
  src/*.tsx)
    if ! out=$(node scripts/lint-rtl.mjs 2>&1); then problems+=$'Физические классы (используйте логические):\n'"$out"$'\n'; fi
    ;;
  src/shared/i18n/locales/*.json)
    # Паритет ключей ar/en без учёта форм множественного числа (в арабском их больше).
    keys() { jq -r '[paths(scalars) | map(tostring) | join(".")] | .[]' "$1" | sed -E 's/_(zero|one|two|few|many|other)$//' | sort -u; }
    dir=src/shared/i18n/locales
    if ! diff=$(diff <(keys "$dir/ar.json") <(keys "$dir/en.json")); then
      problems+=$'Паритет ключей ar/en нарушен (< только в ar, > только в en):\n'"$diff"$'\n'
    fi
    ;;
esac

if [[ -n "$problems" ]]; then
  printf '%s' "$problems" | head -c 4000 >&2
  exit 2
fi
exit 0
