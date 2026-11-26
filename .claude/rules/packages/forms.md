---
paths:
  - "packages/forms/**"
---

# @xaendar/forms

The forms of the components: `FormControlDirective`, the host directive making a component a control of the native forms (the form-associated custom elements of the browser), and its types (`FormValue`, `FormValueSource`, `FormValidator`, `FormValidityErrors`, `FormError`, `ValueOrGetter`), plus `Validators` (`utils/validators`, exported as a namespace: `export * as Validators`): the standard validators, each a factory taking the signal to check and returning a `FormValidator`, so the effect that runs it follows the signals it reads. `@xaendar/core` is a peerDependency, `@xaendar/types` a dependency (external, shared with core).

## Build and specs

- A Xaendar library, as `@xaendar/directives` (see `directives.md`): `build-projects` builds it after `core` with `xd build`, into `dist/@xaendar/forms` with `xaendar-manifest.json`; its `tsconfig.json` leads `@xaendar/*` to the builds in `dist`.
- Specs run in the `directives` Vitest project, transpiled by `createBabelPlugin`. `*.directive.ts` is out of the coverage: put the behavior in `utils/` and test it there.

## FormControlDirective

- `FormControlDirective` (selector `formControl`): a host directive; it declares the native form callbacks (`formDisabledCallback`, `formResetCallback`, `formStateRestoreCallback`), which makes `@WebComponent` set the static `formAssociated` and forward them (`_applyHostCallbacks` of core): no flag anywhere, and no check, since `attachInternals()` itself throws on an element that is not form-associated. It attaches `ElementInternals` lazily (`internals`, `attachInternals?.() ?? null`: `null` on the server), keeps four signals, the private `_untouched`, `_pristine`, `_valid` and `_disabled` (the internal flags are already the positive versions, the consumer negates for the others) exposed by `asReadonly()` as the public `ReadonlySignal` fields `untouched`, `pristine`, `valid`, `disabled` (assigned in the constructor, since they come from private fields: fields to follow, never methods, and no `computed`: the same object, no second node), the source of `setValue` (once: a second call throws; unbound by the effect's `onCleanup`, so a reconnection sets it again), its initial value (only for the reset), the `_errors` signal (exposed as `errors`, the shared frozen `NO_FORM_ERRORS` when there is none so a pass is not a change; `_valid` is its emptiness, kept apart as the fourth state signal), and the effect of `setValidators` (replaced by each call, `[]` writes valid; the anchor returns `HTMLElement | undefined`, never `null`; it writes `_valid` too, also where there are no internals). Touched comes from `@HostListener('focusout')` only, as Angular's blur: never from `invalid`, which any `checkValidity()` fires. Dirty is never derived from the value: it is set by `input` and `change` on the host (`@HostListener`s on `_edit`), so pasting the same text counts and going back to the first value stays dirty; the code writing the source does not count; only the reset clears it. Touched and dirty are also custom states (`internals.states`). The logic it can share is in `utils/form-control` (`findFormErrors`, `writeFormValidity`, `writeState`), tested there; `setValidity` always gets its first argument (`{}` for valid), which the browser requires.
