#!/usr/bin/env bash
# PreToolUse (Edit|Write|MultiEdit|NotebookEdit): защищённые пути проекта (мастер-промпт 8b.1, инварианты 4 и 7).
# Пропуск: tokens.css и shared/ui — субагенту design-system-owner или с TADUM_ALLOW_PROTECTED=1;
# docs/product, tov-lexicon.json и копия шаблона DoD — только в ветке синхронизации docs/sync-product-docs-*
# (скилл /sync-product-docs, решение Кирилла 2026-11-09) или с TADUM_DOCS_SYNC=1.
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
# Ветка синхронизации снимка Drive: снимок меняется только в ней, а merge в main делает Кирилл.
docs_sync=0
docs_sync_allowed && docs_sync=1

case "$rel" in
  docs/product/* | tov-lexicon.json)
    [[ "$docs_sync" == 1 ]] && exit 0
    deny "Защищённый путь: $rel. Это снимок Google Drive: меняется только скиллом /sync-product-docs в ветке docs/sync-product-docs-*. Сначала правка в Drive (по решению Кирилла), затем синхронизация."
    ;;
  .github/PULL_REQUEST_TEMPLATE.md)
    # Копия шаблона DoD из Drive — тоже только синхронизацией.
    [[ "$docs_sync" == 1 || "$allow_protected" == 1 ]] && exit 0
    deny "Защищённый путь: $rel. Копия шаблона из Drive: меняется скиллом /sync-product-docs в ветке docs/sync-product-docs-*."
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
