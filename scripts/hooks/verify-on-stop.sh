#!/usr/bin/env bash
# Stop: не останавливаться с красным verify (инвариант 8). Только если менялся src/ и это не повторный вызов.
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

input=$(cat)
[[ "$(jq -r '.stop_hook_active // false' <<<"$input")" == true ]] && exit 0
root=$(project_dir)
[[ -z "$(git -C "$root" status --porcelain -- src)" ]] && exit 0

echo "verify-on-stop: в src/ есть изменения — запускаю pnpm verify" >&2
log=$(mktemp)
if (cd "$root" && pnpm verify >"$log" 2>&1); then
  rm -f "$log"
  exit 0
fi
tail_log=$(tail -n 40 "$log" | sed -E 's/\x1b\[[0-9;]*m//g')
rm -f "$log"
jq -cn --arg reason "pnpm verify упал — исправьте до остановки (инвариант 8). Хвост лога:
$tail_log" '{decision: "block", reason: $reason}'
