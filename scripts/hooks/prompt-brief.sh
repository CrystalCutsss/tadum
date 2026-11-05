#!/usr/bin/env bash
# UserPromptSubmit: упомянута фича TD-### — напомнить открыть бриф.
set -euo pipefail
command -v jq >/dev/null 2>&1 || exit 0
prompt=$(jq -r '.prompt // empty')
if [[ "$prompt" =~ TD-([0-9]{3}) ]]; then
  id="TD-${BASH_REMATCH[1]}"
  echo "Упомянута фича $id: сначала откройте её бриф (Drive «05 Разработка/Фичи», файл $id-*.md) и Issue. Нет брифа — /feature-brief $id."
fi
exit 0
