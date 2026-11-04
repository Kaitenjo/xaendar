---
name: new-component
description: Scaffold a new Xaendar component with the xd CLI, and optionally implement it, test it and use it in a parent template. Use whenever the user asks to create or add a component in a Xaendar project.
argument-hint: <selector> [folder] [what it should do]
---

# New Xaendar component

Arguments: `$ARGUMENTS` (when empty, take them from the request of the user).

The first argument is the selector (for example `app-user-card`). The optional second argument is the folder in which to create it; it defaults to the folder of the root component under `src/`. Any remaining text describes what the component should do.

1. **Validate the selector**: it starts with a lowercase ASCII letter, contains a dash, has no uppercase letters, spaces or symbols other than `-`, `.` and `_`, is not a reserved name (`font-face`, `annotation-xml`, …), and is not already used by another `@WebComponent` (`grep -rn "selector: '<name>'" src`). Prefer the prefix the other components use. If it is invalid, propose a valid name and stop.

2. **Generate the files** from the project root (the folder of `xaendar.json`):
   ```bash
   npx xd generate component <selector> -p <folder>
   ```
   The command (alias `xd g c`) creates `<folder>/<selector>/` containing `<selector>.xd.component.ts`, `.html`, the stylesheet in the format of `generate.components.style` of the nearest `xaendar.json` (`.css` without it) and `.spec.ts`, with a class named `<PascalCase>Component`. It stops if the folder exists: never pass `-f`, which deletes it, unless the user asks. If `xd` is not installed (`npx xd --version` fails), create the same files by hand:
   ```ts
   import { CustomElement, WebComponent } from '@xaendar/core';

   @WebComponent({
     selector: '<selector>',
     styleUrl: './<selector>.xd.component.<style>',
     templateUrl: './<selector>.xd.component.html'
   })
   export class <PascalCase>Component extends CustomElement {

   }
   ```
   A `.scss`/`.sass` stylesheet needs `sass` in the devDependencies, a `.less` one `less`.

3. **Implement it**, if a description was given, following the `xaendar` skill: inputs as `@Property` accessors typed `InputSignal<T>`, outputs as `@Event` accessors typed `Output<T>`, attributes, classes and listeners of its own element as `@HostProperty` / `@HostEvent` members, state in signals, and a template that follows the template-syntax rules. Avoid member names that clash with `HTMLElement`. Apply the code conventions of the `xaendar` skill: member order, a `_` prefix on private members, `computed` callbacks in private `_computeX()` methods, and constants used only by this component kept as its members.

4. **Use it**, if a parent was indicated: add `@import { <PascalCase>Component } from '<relative path>.xd.component.ts'` at the top of the parent template and place `<selector … />` there, binding every `@Property.required` input. The import also defines the component at runtime: nothing to register in `main.ts` or `bootstrap.ts`. A component created only in code (`this.createComponent`) is imported by the TypeScript module creating it.

5. **Test it**: the generated spec mounts the tag and checks the placeholder `<selector> works!`. Update it to what the component renders, following the `test` skill of this plugin (`/xaendar:test`).

6. **Verify** by running the `/xaendar:check` steps on the project. Report any `Xaendar:` error or `tsc` error, and fix it before finishing.
