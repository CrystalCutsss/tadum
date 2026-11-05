---
name: release-proto
description: "Опубликовать версию vN на витрину Proto (pnpm run release:proto, ADR-003) с остановкой перед push и деплоем и подготовить release notes."
argument-hint: "<vN>"
disable-model-invocation: true
---

# Публикация $ARGUMENTS на витрину

Общий ресурс: push в `main` Proto и деплой — только после «да» Кирилла (`.claude/rules/secrets-and-shared.md`).

1. Делегируй подготовку субагенту `release-manager` (версия `$ARGUMENTS`, путь к клону Proto `$PROTO_DIR`): `pnpm verify`, `pnpm run release:proto $ARGUMENTS` до первой остановки, diff Proto, dry-run деплоя.
2. Release notes `docs/releases/$ARGUMENTS.md` (русский): что вошло, что отложено, известные ограничения, как смотреть (персоны, ссылки `?persona=`; про два пароля — без значений), что проверить команде. Копия — Drive `06 Версии прототипа` (`1jaJlwTatckcrnzIE-qZBLDSDhWDejDFT`) файлом `$ARGUMENTS.md`.
3. Покажи Кириллу diff, dry-run и release notes, спроси: «Публикуем $ARGUMENTS?».
4. После «да» — продолжить скрипт (push Proto, деплой, тег `$ARGUMENTS` в Tadum). Пароль Tadum в `PROTOTYPE_PASSWORDS` ставит Кирилл — дай инструкцию из скрипта и жди подтверждения.
5. Проверь: `/p/tadum/$ARGUMENTS/` открывается после двух паролей, другие прототипы витрины открываются. Ссылку и команду отката — Кириллу и в release notes.
