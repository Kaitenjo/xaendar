---
paths:
  - "packages/forms/**"
---

# @xaendar/forms

The forms, in two directives, as Angular splits a `ControlValueAccessor` from `ngModel`/`formControl`: `FormAssociatedDirective`, the bridge making a component a field of the native forms (the form-associated custom elements of the browser), and `FormControlDirective`, Angular's states, validators and errors on any field, native or such a component. Plus the standard validators (`utils/validators`, exported one by one: `required`, `requiredTrue`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `email`, no namespace) and the types (`FormValue`, `FormValueSource`, `FormValidator`, `FormValidityErrors`, `FormError`, `NativeFormField`, `ValueOrGetter`). `@xaendar/core` is a peerDependency, `@xaendar/types` a dependency (external, shared with core).

## Build and specs

- A Xaendar library, as `@xaendar/directives` (see `directives.md`): `build-projects` builds it after `core` with `xd build`, into `dist/@xaendar/forms` with `xaendar-manifest.json`; its `tsconfig.json` leads `@xaendar/*` to the builds in `dist`.
- Specs run in the `directives` Vitest project, transpiled by `createBabelPlugin`. `*.directive.ts` is out of the coverage: put the behavior in `utils/` and test it there.

## Validators and errors

- A validator is Angular's: `(value: unknown) => FormValidityErrors | undefined`, the errors by name with their message. The names are the flags of `ValidityState` or names of one's own; on a component (`writeFormValidity`) a native name sets its flag and another name `customError`; on a native field the first error of the validators goes to `setCustomValidity()`. The standard validators are factories with an optional last `message` (default in English), the limits and patterns a `ValueOrGetter`; empty values pass all but `required`; text patterns are anchored.
- `findFormErrors(validators, value)` gives `{ name, message }[]` in order, the shared frozen `NO_FORM_ERRORS` when there is none, so a validity computed again with no error is not a change; `NO_FORM_VALIDATORS` is the shared default list.

## FormAssociatedDirective

- A host directive of the component (selector `formAssociated`); it declares the native form callbacks (`formDisabledCallback`, `formResetCallback`, `formStateRestoreCallback`), which makes `@WebComponent` set the static `formAssociated` and forward them (`_applyHostCallbacks` of core): no flag anywhere. It attaches `ElementInternals` lazily (`internals`, `attachInternals?.() ?? null`: `null` on the server), keeps the source of `setValue` (once: a second call throws; unbound by the effect's `onCleanup`, so a reconnection sets it again; exposed as `source` for `FormControlDirective`), its initial value (written back by the reset), `disabled` and `errors` (read-only signals by `asReadonly()`), the component's own validators (`setValidators`, a signal: each call replaces them, `[]` removes them; the anchor returns `HTMLElement | undefined`, never `null`) and the custom errors `setCustomErrors` gives (`FormControlDirective`'s).
- Two effects started in `afterRender` (the component gives its value in its `onInit`, after its host directives start): one computes `errors` from the validators and the source, the other writes the validity from `errors` plus the custom errors. Kept apart so that `FormControlDirective`, which reads `errors` and writes the custom errors, never loops.

## FormControlDirective

- A template directive (selector `formControl`, input `validators`), applied by the code using the field, reached with `@Query.ref(name, { read: FormControlDirective })`. On a component (`element instanceof CustomElement` with `FormAssociatedDirective` among its host directives) it validates the source of the bridge and gives it the errors with `setCustomErrors`; on a native field (`isNativeFormField`: it answers `setCustomValidity`) it keeps the value in a private signal, read by `readNativeValue` (Angular's accessors: `checked`, a number or `null`, the values of a multiple select, the text) on `input`/`change` and after the reset, reads the error of its own constraints (`readNativeErrors`, one at most, with `validationMessage`, after clearing the custom error) and gives the first error of the validators to `setCustomValidity`. Anything else throws.
- Four public signals, `untouched`, `pristine`, `valid`, `errors` (positive versions only, private writable ones exposed with `asReadonly()` in the constructor), plus the private value signal of a native field. Touched comes from `@HostListener('focusout')` only, as Angular's blur; dirty from `input` and `change` (`_edit`), never from comparing values. The reset of the form (`reset` on the form found at `onInit`: `field.form` or `internals.form`, in a microtask, since the form resets its fields after the event) makes it untouched and pristine. On a component, touched and dirty are also custom states through the bridge's `internals.states`. `onDestroy` removes the listener and the custom error it gave.
