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

# Отказ PreToolUse с причиной на русском.
deny() {
  jq -cn --arg reason "$1" '{hookSpecificOutput: {hookEventName: "PreToolUse", permissionDecision: "deny", permissionDecisionReason: $reason}}'
  exit 0
}
