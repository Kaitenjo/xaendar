---
name: check
description: Compile and type-check a Xaendar project with xd build, which reports the template errors, the stylesheet errors and the type errors of the whole project. Use after editing Xaendar components, templates, directives or stylesheets, or before committing them.
argument-hint: [project folder]
allowed-tools: Bash(npx xd build*), Read, Grep, Glob
---

# Check a Xaendar project

Arguments: `$ARGUMENTS` (the project folder, the one containing `vite.config.ts` and `tsconfig.json`; the current folder when empty).

1. **Build**: from the project folder, run:
   ```bash
   npx xd build 2>&1
   ```
   Collect:
   - every block starting with `Xaendar:`. Template errors name the template or component and carry a `[Lexer]`, `[Parser]` or `[TypeChecker]` message with `[Ln x, Col y]`. `[TypeChecker] Type check failed`, printed once the bundle is built, lists the type errors of the whole project as `tsc` prints them: `file(line,col): error TSxxxx: …`. TS2416 / "defines instance member function … as instance member accessor" comes from a member whose name clashes with `HTMLElement` (`title`, `remove`, `hidden`, `lang`, …): rename the member, and keep the attribute name with `alias`;
   - the `Build failed with N error(s)` block printed at the end: `[plugin xaendar] … RolldownError: Failed to compile component - <path>` repeats a template error printed above, while `Failed to compile style - <path>` is followed by the error of Sass or Less, a missing `sass`/`less` package or an unsupported extension. The Node stack trace after it is noise.

2. **Explain and fix**: for each message, look up its text in `${CLAUDE_PLUGIN_ROOT}/skills/xaendar/references/errors.md` for the cause and fix. Fix the errors in files this session changed. For errors elsewhere, report them and ask before touching them.

3. **Report**: give the number of template errors, stylesheet errors and type errors, grouped by file, with `file:line`, plus what you fixed. If the build is clean, say so in one line. To run the specs too, use `/xaendar:test`.

The build writes `dist/`; it changes nothing else.
