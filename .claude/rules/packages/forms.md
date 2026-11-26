---
paths:
  - "packages/forms/**"
---

# @xaendar/forms

The forms of the components: `FormControlDirective`, the host directive making a component a control of the native forms (the form-associated custom elements of the browser), and its types (`FormValue`, `FormValueSource`, `FormValidator`, `FormValidityErrors`). `@xaendar/core` is a peerDependency, `@xaendar/types` a dependency (external, shared with core).

## Build and specs

- A Xaendar library, as `@xaendar/directives` (see `directives.md`): `build-projects` builds it after `core` with `xd build`, into `dist/@xaendar/forms` with `xaendar-manifest.json`; its `tsconfig.json` leads `@xaendar/*` to the builds in `dist`.
- Specs run in the `directives` Vitest project, transpiled by `createBabelPlugin`. `*.directive.ts` is out of the coverage: put the behavior in `utils/` and test it there.

## FormControlDirective

- `FormControlDirective` (selector `formControl`): a host directive; it declares the native form callbacks (`formDisabledCallback`, `formResetCallback`, `formStateRestoreCallback`), which makes `@WebComponent` set the static `formAssociated` and forward them (`_applyHostCallbacks` of core): no flag anywhere, and no check, since `attachInternals()` itself throws on an element that is not form-associated. It attaches `ElementInternals` lazily (`internals`, `attachInternals?.() ?? null`: `null` on the server), keeps the private signals `_disabled`, `_touched`, `_dirty` and `_invalid`, exposed as read-only `computed` fields of the positive versions only (`untouched`, `pristine`, `valid`, `disabled`: fields to follow, never methods; the consumer negates for the others), the source of `setValue` (once: a second call throws; unbound by the effect's `onCleanup`, so a reconnection sets it again), its initial value (only for the reset), and the effect of `setValidators` (replaced by each call, `[]` writes valid; the anchor returns `HTMLElement | undefined`, never `null`; it writes `_invalid` too, also where there are no internals). Touched comes from `@HostListener('focusout')` and `('invalid')`. Dirty is never derived from the value: it is set by `input` and `change` on the host (`@HostListener`s on `_edit`), so pasting the same text counts and going back to the first value stays dirty; the code writing the source does not count; only the reset clears it. Touched and dirty are also custom states (`internals.states`). The logic it can share is in `utils/form-control` (`findFormErrors`, `writeFormValidity`, `writeState`), tested there; `setValidity` always gets its first argument (`{}` for valid), which the browser requires.
