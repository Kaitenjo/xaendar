---
paths:
  - "packages/forms/**"
---

# @xaendar/forms

The forms, in two directives, as Angular splits a `ControlValueAccessor` from `ngModel`/`formControl`: `FormAssociatedDirective`, the bridge making a component a field of the native forms (the form-associated custom elements of the browser), and `FormFieldDirective`, Angular's states, validators and errors on any field, native or such a component. Plus the standard validators (`utils/validators`, exported one by one: `required`, `requiredTrue`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `email`, no namespace) and the types (`FormValue`, `FormValueSource`, `FormValidator`, `FormValidityErrors`, `FormError`, `NativeFormField`, `ValueOrGetter`). `@xaendar/core` is a peerDependency, `@xaendar/types` a dependency (external, shared with core).

## Build and specs

- A Xaendar library, as `@xaendar/directives` (see `directives.md`): `build-projects` builds it after `core` with `xd build`, into `dist/@xaendar/forms` with `xaendar-manifest.json`; its `tsconfig.json` leads `@xaendar/*` to the builds in `dist`.
- Specs run in the `directives` Vitest project, transpiled by `createBabelPlugin`. `*.directive.ts` is out of the coverage: put the behavior in `utils/` and test it there.

## Validators and errors

- A validator is Angular's: `(value: unknown) => FormValidityErrors | undefined`, the errors by name with their message. The names are the flags of `ValidityState` or names of one's own; on a component (`writeFormValidity`) a native name sets its flag and another name `customError`; on a native field the first error of the validators goes to `setCustomValidity()`. The standard validators are factories with an optional last `message` (default in English), the limits and patterns a `ValueOrGetter`; empty values pass all but `required`; text patterns are anchored.
- `findFormErrors(validators, value)` gives `{ name, message }[]` in order, the shared frozen `NO_FORM_ERRORS` when there is none, so a validity computed again with no error is not a change; `NO_FORM_VALIDATORS` is the shared default list.

## FormAssociatedDirective

- A host directive of the component (selector `formAssociated`); it declares the native form callbacks (`formDisabledCallback`, `formResetCallback`, `formStateRestoreCallback`), which makes `@WebComponent` set the static `formAssociated` and forward them (`_applyHostCallbacks` of core): no flag anywhere. It attaches `ElementInternals` lazily (`internals`, `attachInternals?.() ?? null`: `null` on the server), keeps the source of `setValue` and its conversion (once: a second call throws; exposed as `source` for `FormFieldDirective`), its initial value (written back by the reset), `disabled` and `errors` (read-only signals by `asReadonly()`), the component's own validators (`setValidators`, a signal: each call replaces them, `[]` removes them; the anchor returns `HTMLElement | undefined`, never `null`) and the custom errors `setCustomErrors` gives (`FormFieldDirective`'s).
- One effect, started in `afterRender` (the component gives its value in its `onInit`, after its host directives start; its `onCleanup` forgets the source, so a reconnection sets it again): it writes the value (`setFormValue`), then the errors of the validators for it and the validity, in that order, so the form never holds the previous value with the new validity. It reads no signal after writing it (`errors` is passed to `_writeValidity`, never read back: a computed signal writing then reading a source warns of `computing → dirty`). The custom errors are a plain field: `setCustomErrors` writes the validity at once, `untracked`, so the effect of `FormFieldDirective` calling it follows neither the own errors nor the anchor through it, and the component's validators do not run again.

## FormFieldDirective

- A template directive (selector `formField`, input `validators`), applied by the code using the field, reached with `@Query.ref(name, { read: FormFieldDirective })`. It works on a `FormFieldTarget` chosen once in `onInit` and kept in its single `_target`: `ComponentFieldTarget` for a component (`element instanceof CustomElement` with `FormAssociatedDirective` among its host directives: value from the bridge's `source`, own errors from its `errors`, custom errors to `setCustomErrors`, custom states through its `internals`), `NativeFieldTarget` for a native field (`isNativeFormField`, by the tag `input`/`select`/`textarea`, never by duck typing: a component with a `setCustomValidity` of its own is not one; its value in a private signal read by `readNativeValue` when it starts, on `input`/`change` and after the reset; own error from `readNativeErrors`; the first custom error to `setCustomValidity`; no custom states). Anything else throws. N.B. never put fields or branches of one kind of field in the directive: they go in its target.
- Four public signals, `untouched`, `pristine`, `valid`, `errors` (positive versions only, private writable ones exposed with `asReadonly()` in the constructor). Touched comes from `@HostListener('focusout')` only, as Angular's blur; dirty from `input` and `change` (`_edit`, which also lets the target take the value), never from comparing values. The reset of the form (`reset` on `_target.form`, in a microtask, since the form resets its fields after the event) makes it untouched and pristine. `onDestroy` removes the listener and the custom errors it gave.
