---
paths:
  - "packages/*/src/**"
  - "src/docs/src/i18n/**"
  - "src/docs/src/pages/reference/**"
  - ".claude/rules/{class-members,code-style,templates}.md"
  - "plugins/xaendar/**"
---

# Claude Code plugin

`plugins/xaendar` teaches Claude to write applications with Xaendar. When a change alters what users see (a public API, a template construct, a message, a CLI command, the build, the styles) or a convention of `class-members.md`, `code-style.md`, `templates.md`, update in the same task:

- `skills/xaendar/SKILL.md` and the reference involved (`references/api.md`, `errors.md`, `template-syntax.md`, `patterns.md`, `angular.md`: their sources are listed in `plugins/xaendar/README.md`);
- the skills and the agent relying on it (`skills/check`, `new-component`, `new-directive`, `test`, `agents/xaendar-reviewer.md`);
- `version` in `plugins/xaendar/.claude-plugin/plugin.json`.

After a change to `packages/language-server`, `language-core` or `compiler`, rebuild the bundled server with `npm run build:claude-plugin`.
