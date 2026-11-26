---
name: add-translation
description: Add or change a user-facing TempVoice text in all language files (en, de, cn, id, jp, ru). Use whenever code needs a new message, label or log text.
---

# Add a translation key

Background: `src/utils/t.js` falls back to `en`, then to the raw key;
`src/utils/logger.js` `log()` warns with `missing_lang_key` when a key is
missing.

## Steps

1. Pick a snake_case key. Conventions in `language/en.js`: `<id>` (button
   label), `<id>_desc`, `<id>_updated`, `log_<id>` (log channel message),
   `invalid_<thing>`.
2. Add the key to every file: `language/en.js`, `language/de.js`,
   `language/cn.js`, `language/id.js`, `language/jp.js`, `language/ru.js`.
   Same placeholder names (`{user}`, `{channel}`, ...) in every language.
   If no translation is available, use the English text and say so in the
   change record.
3. Use it via `t('<key>', config.language, { ... })` or
   `log('<key>', client, { ... })`.
4. Check: `grep -c '"<key>"' language/*.js` returns one hit per file.
5. Then the `document-change` skill; run `npm run lint`.

## Rules

- No user-facing string literals in handlers; always a key.
- A new language needs a file in `language/`, an import in
  `language/language.js` and an entry in `validLanguages` in
  `config/config.js`.
