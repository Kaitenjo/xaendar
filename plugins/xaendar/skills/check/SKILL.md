---
name: check
description: Compile and type-check a Xaendar project the way the build cannot on its own — xd build reports template errors but exits 0, and never type-checks component classes. Use after editing Xaendar components or templates, or before committing them.
argument-hint: [project folder]
allowed-tools: Bash(npx xd build*), Bash(npx tsc *), Read, Grep, Glob
---

# Check a Xaendar project

Arguments: `$ARGUMENTS` (the project folder, the one containing `vite.config.ts` and `tsconfig.json`; the current folder when empty).

`xd build` prints template errors in red, prefixed by `Xaendar:`, and then **exits 0**. The broken component reaches the bundle without a render function. Component classes are never type-checked by the build. Run both checks below. Do not trust the exit codes; read the output.

1. **Templates**: from the project folder, run:
   ```bash
   npx xd build 2>&1
   ```
   Collect every block starting with `Xaendar:`. Each one names the template or component and carries a `[Lexer]`, `[Parser]` or `[TypeChecker]` message with `[Ln x, Col y]`. Also collect the warnings `Could not find template at …` and `Unsupported stylesheet extension …`.

2. **Classes**: from the same folder, run:
   ```bash
   npx tsc --noEmit -p tsconfig.json
   ```
   Pay attention to TS2416 / "defines instance member function … as instance member accessor". These come from a member whose name clashes with `HTMLElement` (`title`, `remove`, `hidden`, `lang`, …). Rename the member, and keep the attribute name with `alias`.

3. **Explain and fix**: for each message, look up its text in `${CLAUDE_PLUGIN_ROOT}/skills/xaendar/references/errors.md` for the cause and fix. If the code looks correct, check `${CLAUDE_PLUGIN_ROOT}/skills/xaendar/references/known-issues.md`, because some messages come from framework bugs that have workarounds. Fix the errors in files this session changed. For errors elsewhere, report them and ask before touching them.

4. **Report**: give the number of template errors and type errors, grouped by file, with `file:line`, plus what you fixed. If both checks are clean, say so in one line.
