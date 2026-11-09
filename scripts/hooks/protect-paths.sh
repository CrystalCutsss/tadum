#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit|NotebookEdit): защищённые пути проекта (мастер-промпт 8b.1, инварианты 4 и 7).
# Пропуск: tokens.css и shared/ui — субагенту design-system-owner или с TADUM_ALLOW_PROTECTED=1;
# docs/product и tov-lexicon.json — только с TADUM_DOCS_SYNC=1 (скилл /sync-product-docs).
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
require_jq_or_block

input=$(cat)
file=$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty' <<<"$input")
agent=$(jq -r '.agent_type // empty' <<<"$input")
[[ -z "$file" ]] && exit 0

rel=$(rel_path "$file")
# Вне проекта — не наше дело.
[[ "$rel" == ../* ]] && exit 0

allow_protected=${TADUM_ALLOW_PROTECTED:-0}

case "$rel" in
  docs/product/* | tov-lexicon.json)
    [[ "${TADUM_DOCS_SYNC:-0}" == 1 ]] && exit 0
    deny "Защищённый путь: $rel. Это снимок Google Drive: меняется только скиллом /sync-product-docs в сессии TADUM_DOCS_SYNC=1. Правку предложите Кириллу текстом."
    ;;
  src/styles/tokens.css | src/shared/ui/*)
    [[ "$agent" == design-system-owner || "$allow_protected" == 1 ]] && exit 0
    deny "Защищённый путь: $rel. Токены и shared/ui меняет только субагент design-system-owner — делегируйте ему."
    ;;
  .claude/settings.json)
    # Решение Кирилла 2026-11-06: настройки Claude — не отказ, а вопрос в диалоге, чтобы одобрить правку
    # (например, разрешения коннекторов) в текущей сессии без перезапуска с TADUM_ALLOW_PROTECTED=1.
    [[ "$allow_protected" == 1 ]] && exit 0
    ask "Защищённый путь: $rel (настройки Claude). Нужно подтверждение Кирилла: проверьте правку и разрешите или отклоните."
    ;;
  src/shared/api/ports/* | pnpm-lock.yaml | .github/* | .gitlab-ci.yml | wrangler.jsonc)
    [[ "$allow_protected" == 1 ]] && exit 0
    deny "Защищённый путь: $rel. Порты, lock-файл, CI и wrangler меняются через ADR или с разрешения Кирилла (сессия TADUM_ALLOW_PROTECTED=1). lock-файл — только через pnpm."
    ;;
esac

# ux-writer правит только тексты.
if [[ "$agent" == ux-writer ]]; then
  case "$rel" in
    src/shared/i18n/locales/* | docs/i18n/*) ;;
    *) deny "ux-writer правит только src/shared/i18n/locales/** и docs/i18n/**, а не $rel." ;;
  esac
fi
exit 0
