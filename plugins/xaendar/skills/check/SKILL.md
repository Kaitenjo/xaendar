---
name: check
description: Compile and type-check a Xaendar project with xd build, which reports the template errors and the type errors of the whole project. Use after editing Xaendar components or templates, or before committing them.
argument-hint: [project folder]
allowed-tools: Bash(npx xd build*), Read, Grep, Glob
---

# Check a Xaendar project

Arguments: `$ARGUMENTS` (the project folder, the one containing `vite.config.ts` and `tsconfig.json`; the current folder when empty).

`xd build` prints template errors and type errors in red, prefixed by `Xaendar:`, and fails.

1. **Build**: from the project folder, run:
   ```bash
   npx xd build 2>&1
   ```
   Collect every block starting with `Xaendar:`:
   - Template errors name the template or component and carry a `[Lexer]`, `[Parser]` or `[TypeChecker]` message with `[Ln x, Col y]`.
   - `[TypeChecker] Type check failed` lists the type errors of the TypeScript as `tsc` prints them: `file(line,col): error TSxxxx: …`. TS2416 / "defines instance member function … as instance member accessor" comes from a member whose name clashes with `HTMLElement` (`title`, `remove`, `hidden`, `lang`, …). Rename the member, and keep the attribute name with `alias`.

   Also collect the warnings `Could not find template at …` and `Unsupported stylesheet extension …`.

2. **Explain and fix**: for each message, look up its text in `${CLAUDE_PLUGIN_ROOT}/skills/xaendar/references/errors.md` for the cause and fix. If the code looks correct, check `${CLAUDE_PLUGIN_ROOT}/skills/xaendar/references/known-issues.md`, because some messages come from framework bugs that have workarounds. Fix the errors in files this session changed. For errors elsewhere, report them and ask before touching them.

3. **Report**: give the number of template errors and type errors, grouped by file, with `file:line`, plus what you fixed. If the build is clean, say so in one line.
