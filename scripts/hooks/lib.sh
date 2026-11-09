#!/usr/bin/env bash
# Общие функции хуков Claude Code (блок 8b). Ввод хука — JSON на stdin, разбор — jq.

# Корень проекта: переменная Claude Code, иначе — на два уровня выше этого файла.
project_dir() {
  if [[ -n "${CLAUDE_PROJECT_DIR:-}" ]]; then printf '%s' "$CLAUDE_PROJECT_DIR"; else (cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd); fi
}

# Путь относительно корня проекта (работает и для ещё не созданных файлов).
rel_path() {
  realpath -m --relative-to="$(project_dir)" "$1"
}

# Снимок Drive (docs/product, tov-lexicon.json, шаблон PR) можно менять: в ветке синхронизации
# docs/sync-product-docs-* (скилл /sync-product-docs, решение Кирилла 2026-11-09) или с TADUM_DOCS_SYNC=1.
docs_sync_allowed() {
  [[ "${TADUM_DOCS_SYNC:-0}" == 1 ]] && return 0
  local branch
  branch=$(git -C "$(project_dir)" branch --show-current 2>/dev/null || true)
  [[ "$branch" == docs/sync-product-docs-* ]]
}

# Отказ PreToolUse с причиной на русском.
deny() {
  jq -cn --arg reason "$1" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
}

# Вместо отказа — вопрос владельцу: Claude Code показывает диалог подтверждения с причиной.
ask() {
  jq -cn --arg reason "$1" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "ask", permissionDecisionReason: $reason}}'
  exit 0
}

# Защитные хуки работают по принципу fail closed: без jq ввод не разобрать — отказываем (exit 2 блокирует
# действие, stderr видит Claude). Иначе ошибка 127 считалась бы «некритичной» и действие прошло бы.
require_jq_or_block() {
  command -v jq >/dev/null 2>&1 && return 0
  echo "Хук $(basename "$0"): не найден jq — действие заблокировано. Установите jq (apt-get install jq / brew install jq)." >&2
  exit 2
}

# Вспомогательные хуки без jq просто ничего не делают.
require_jq_or_skip() {
  command -v jq >/dev/null 2>&1 || exit 0
}
