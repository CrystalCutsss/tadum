# Changesets

Каждый PR с изменением поведения добавляет changeset: `pnpm exec changeset` — тип изменения (patch / minor / major) и описание для человека.
Версия приложения берётся из `package.json` (`pnpm exec changeset version` поднимает её и пишет `CHANGELOG.md`); она видна в «Помощи» и в событии `app_loaded` (`app_version`).
Пакет не публикуется в npm (`private: true`).
