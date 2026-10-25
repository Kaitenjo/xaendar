---
name: new-directive
description: Create a Xaendar directive, custom (@@name, acts on the element it is applied to) or structural (*name, decides whether the element is rendered), and optionally apply it in a template. Use whenever the user asks to create or add a directive in a Xaendar project.
argument-hint: <selector> [custom|structural] [folder] [what it should do]
---

# New Xaendar directive

Arguments: `$ARGUMENTS` (when empty, take them from the request of the user).

The first argument is the selector, in camelCase (`appTooltip`); the second the kind, `custom` by default; the third the folder, by default the folder of the component that will use it, or `src/directives/` for a directive shared by several components. Any remaining text describes the behavior.

1. **Validate the selector**: an identifier in camelCase, with the prefix the other directives of the project use (`grep -rn "@Directive({" src`), and not already used: selectors share one registry with the libraries of the application, so prefix them. No dash is needed.

2. **Create** `<folder>/<kebab-name>.directive.ts` with a class named `<PascalCase>Directive` (`appTooltip` → `tooltip.directive.ts`, `TooltipDirective`, or keep the prefix in the names when the project does). There is no `xd` command for directives.

   Custom directive:
   ```ts
   import { CustomDirective, Directive, Event, Property } from '@xaendar/core';
   import type { Output } from '@xaendar/core';
   import type { InputSignal } from '@xaendar/core/signals';

   @Directive({ selector: 'appTooltip' })
   export class TooltipDirective extends CustomDirective<HTMLElement> {
     @Property('')
     public accessor text!: InputSignal<string>;
     @Event()
     public accessor shown!: Output<string>;

     public onInit(): void {
       this.effect(() => {
         this.element.title = this.text();
       });
     }
   }
   ```
   - `this.element` (typed by the argument of `CustomDirective`, SVG and MathML elements included) is set after the constructor: use it from `onInit`, which runs once the inputs are bound and the element is in the document, before its children are rendered (wait a microtask to read them).
   - Effects created with `this.effect` are disposed with the directive. Undo in `onDestroy` what `onInit` did outside the element (nodes appended to `document.body`, listeners on `document`), and leave the element as you found it: a directive applied by a condition is destroyed when its branch is left.
   - Prefer `@HostProperty('attr' | 'class.x')` and `@HostEvent('event')` to listeners and attributes set by hand: they bind the element after `onInit` and are removed when the directive stops.
   - Outputs are dispatched on the element; the template listens to them inside the parentheses of the directive.

   Structural directive:
   ```ts
   import { Directive, Property, StructuralDirective } from '@xaendar/core';
   import type { InputSignal } from '@xaendar/core/signals';

   @Directive({ selector: 'appMinLength' })
   export class MinLengthDirective extends StructuralDirective {
     @Property('')
     public accessor text!: InputSignal<string>;
     @Property(1)
     public accessor min!: InputSignal<number>;

     public shouldRender(): boolean {
       return this.text().trim().length >= this.min();
     }
   }
   ```
   - `shouldRender` runs in an effect and may return a promise: only the signals read before the first `await` are tracked, so read every input at the top. Several structural directives on an element combine with AND.
   - It has no element, no outputs, no hooks and no host bindings: resources it needs live in a module.

   Generic directives declare type parameters on the class; templates infer them from the bound inputs or take them after the selector (`@@appList<Row>(…)`).

3. **Apply it**, if a template was indicated: add `@import { TooltipDirective } from './tooltip.directive.ts'` at the top of the template (it also loads the module at runtime), and apply it with `@@appTooltip(text="{hint()}" (shown)="log($event)")` or `*appMinLength(text="{query()}" min="{3}")`. Without inputs the parentheses can be left out (`@@appTooltip`). A directive is applied once per element, and never on a component that already declares it in `hostDirectives`. Follow the order of the opening tag of the `xaendar` skill.

4. **Verify** by running the `/xaendar:check` steps on the project, then test it through a host component as the `test` skill describes.
