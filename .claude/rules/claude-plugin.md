---
paths:
  - "packages/*/src/**"
  - "src/docs/src/i18n/**"
  - "src/docs/src/pages/**"
  - ".claude/rules/{class-members,code-style,templates,typescript}.md"
  - "plugins/xaendar/**"
---

# Claude Code plugin

`plugins/xaendar` teaches Claude to write applications with Xaendar. When a change alters what users see (a public API, a template construct, a message, a CLI command, the build, the styles, a built-in directive) or a convention of `class-members.md`, `code-style.md`, `templates.md`, `typescript.md`, update in the same task:

- `skills/xaendar/SKILL.md` and the reference involved (`references/api.md`, `errors.md`, `template-syntax.md`, `patterns.md`, `angular.md`: their sources are listed in `plugins/xaendar/README.md`); an export of `@xaendar/directives` goes in the `@xaendar/directives` section of `api.md`, since the site has no API pages for it;
- the skills and the agent relying on it (`skills/check`, `new-component`, `new-directive`, `test`, `agents/xaendar-reviewer.md`): a new pitfall goes in the reviewer, a new convention in the Code conventions of `SKILL.md` and in the reviewer.

After a change to `packages/language-server`, `language-core` or `compiler`, rebuild the bundled server with `npm run build:claude-plugin` and commit `server/server.cjs`. `npm run release:claude-plugin` validates the plugin and pushes its tag (see `plugins/xaendar/README.md`).
