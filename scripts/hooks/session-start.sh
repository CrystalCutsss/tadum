#!/usr/bin/env bash
# SessionStart (startup|resume|compact): инварианты проекта в контекст и где смотреть состояние.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"
cat >/dev/null
root=$(project_dir)
echo "Tadum: инварианты проекта (CLAUDE.md) — соблюдать в каждом шаге:"
sed -n '/^## Инварианты/,/^## /p' "$root/CLAUDE.md" | sed '1d;$d'
echo
echo "Состояние настройки — docs/setup/progress.md; требования — docs/product/ (снимок Drive, не править); решения — docs/product/00-decision-log.md, допущения — docs/decisions/assumptions.md."
