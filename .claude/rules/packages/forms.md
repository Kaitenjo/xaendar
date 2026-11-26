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

- `FormControlDirective` (selector `formControl`, `formAssociated` in its `@Directive`): a host directive only (`onInit` throws through `assertFormAssociated` for an element that is not form-associated), so `@WebComponent` makes its component form-associated and forwards it the native form callbacks (`_applyHostCallbacks` of core). It attaches `ElementInternals` lazily (`internals`, `attachInternals?.() ?? null`: `null` on the server), keeps the `disabled` and `touched` signals, the source of `setValue` (once: a second call throws; unbound by the effect's `onCleanup`, so a reconnection sets it again), its initial value (dirty is derived, `Object.is`), and the effect of `setValidators` (replaced by each call, `[]` writes valid; the anchor returns `HTMLElement | undefined`, never `null`). Touched comes from `@HostListener('focusout')` and `('invalid')`; touched and dirty are also custom states (`internals.states`). The logic it can share is in `utils/form-control` (`writeFormValidity`, `writeState`, `assertFormAssociated`), tested there.
