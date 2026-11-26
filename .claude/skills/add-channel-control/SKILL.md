---
name: add-channel-control
description: Add a new owner control to the TempVoice dashboard (button in embedSender, routing in interactionCreate, handler in src/modals/, translations). Use when the user asks for a new voice channel action such as a new setting or moderation button.
---

# Add a channel control

Background: `docs/architecture.md`, section "Interaction flow". Reference
implementation: `limit` (button -> text modal -> `src/modals/limit.js`).

## Steps

1. **Handler**: create `src/modals/<id>.js` with a default export:

   ```js
   export default {
     customId: '<id>',
     async execute(interaction, client, config) { ... },
   };
   ```

   - First check `OwnershipManager.check(client, channel?.id, member.id)`;
     reply `t('not_owner', lang)` ephemerally on failure.
   - Validate input with `ValidationService` or `Sanitizer`
     (`src/utils/`); add a validator there if needed.
   - Act on the channel, then `log('log_<id>', client, {...})`.
   - Reply ephemerally with `flags: MessageFlags.Ephemeral` and a `t(...)`
     text.
   - Wrap in `try/catch` and call
     `ErrorHandler.handle(error, interaction, client, 'modal:<id>')`.
   The file is loaded automatically by `loadModals()`; the file name is the key.
2. **Button**: add `['<id>', '<custom emoji id>']` to a row in
   `src/handlers/embedSender.js` (max 5 buttons per row) and a Unicode
   fallback in `unicodeEmojis`.
3. **Routing** in `src/events/interactionCreate.js` `handleButton()`:
   - Text input: `this.showTextModal(...)` entry in `buttonHandlers`.
   - User picker: add the id to `userMenus`.
   - String select: a `show...Menu()` method whose select `customId` is
     `<id>_select`.
   - No input: `this.executeDirectModal(interaction, customId)`.
4. **Constants**: add the id to `MODAL_ACTIONS` in `src/constants.js`.
5. **Texts**: follow the `add-translation` skill for `<id>`, `<id>_desc`,
   result and `log_<id>` keys.
6. **Tests**: validator cases in `test/ValidationService.test.js` or
   `test/Sanitizer.test.js`.
7. **Docs**: `docs/architecture.md` (interaction flow list), `README.md`
   dashboard controls; then the `document-change` skill.
8. Run `npm run lint` and `npm test`.

## Notes

- The dashboard message is edited on the next start (`embedSender`), so new
  buttons appear after a restart.
- Do not rename existing ids; see `AGENTS.md`.
