@AGENTS.md

## Claude Code specifics

- Project skills live in `.claude/skills/`. Invoke the matching skill before
  starting a task it covers.
- `.claude/settings.json` allows lint and test commands, asks before
  `npm run deploy`, `git push` and the git-config `make` targets, and denies
  reading `.env` and `data/`.
- Run `npm run lint` and `npm test` before reporting a task as done. Report
  failures with the decisive output line.
