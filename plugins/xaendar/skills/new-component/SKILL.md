---
name: new-component
description: Scaffold a new Xaendar component with the xd CLI, register it so it is defined at runtime, and optionally implement it and use it in a parent template.
argument-hint: <selector> [folder] [what it should do]
disable-model-invocation: true
---

# New Xaendar component

Arguments: `$ARGUMENTS`

The first argument is the selector (for example `app-user-card`). The optional second argument is the folder in which to create it; it defaults to the folder of the root component under `src/`. Any remaining text describes what the component should do.

1. **Validate the selector**: lowercase, starting with a letter, with at least one dash, and not already used by another `@WebComponent` in the project (`grep -r "selector: '<name>'" src`). If it is invalid, propose a valid name and stop.

2. **Generate the files** from the project root:
   ```bash
   npx xd component <selector> -p <folder>
   ```
   Use `xd component` (alias `xd c`): `xd generate component` does not exist. The command creates `<folder>/<selector>/` containing `<selector>.xd.component.ts`, `.html`, `.css` and `.spec.ts`, with a class named `<PascalCase>Component`. If `xd` is not installed (`npx xd --version` fails), create the same four files by hand:
   ```ts
   import { CustomElement, WebComponent } from '@xaendar/core';

   @WebComponent({
     selector: '<selector>',
     styleUrl: './<selector>.xd.component.css',
     templateUrl: './<selector>.xd.component.html'
   })
   export class <PascalCase>Component extends CustomElement {

   }
   ```
   It always writes `.css`, even when `xaendar.json` says otherwise; keep it, because the build compiles only `.css`. The generated spec instantiates the class directly and fails under a plain Vitest config. Tell the user, and do not delete it unless asked.

3. **Register it at runtime**: open `src/main.ts`. If it already loads components through an `import.meta.glob` matching `**/*.xd.component.ts`, there is nothing to do. Otherwise add an import of the new class, following the existing style.

4. **Implement it**, if a description was given, following the `xaendar` skill: inputs as `@Property` accessors typed `InputSignal<T>`, outputs as `@Event` accessors typed `Output<T>` (inline types only), state in signals, and a template that follows the template-syntax rules. Avoid member names that clash with `HTMLElement`. Apply the code conventions of the `xaendar` skill: member order, a `_` prefix on private members, `computed` callbacks in private `_computeX()` methods, and constants used only by this component kept as its members.

5. **Use it**, if a parent was indicated: add `@import { <PascalCase>Component } from '<relative path>.xd.component.ts'` at the top of the parent template and place `<selector … />` there, binding every `@Property.required` input.

6. **Verify** by running the `/xaendar:check` steps on the project. Report any `Xaendar:` error or `tsc` error, and fix it before finishing.
