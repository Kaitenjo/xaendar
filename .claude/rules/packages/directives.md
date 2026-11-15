---
paths:
  - "packages/directives/**"
---

# @xaendar/directives

The built-in directives: `AnimationDirective` (`@@animation(enter="…" leave="…")`), whose `enter` and `leave` are a CSS class or a function (`ElementAnimation`), `''` for no animation on that side, plus `ignoreReducedMotion`. `@xaendar/core` is a peerDependency.

- A Xaendar library (`"xaendar": { "library": true }`): `build-projects` builds it with `xd build` of the CLI, run from its sources in a workspace of its own (`dist/.xaendar-library-<folder>/xaendar.json`, deleted afterwards), into `dist/@xaendar/directives` with `xaendar-manifest.json`, after `core`. `buildLibrary` reads `tsconfig.json`, which leads `@xaendar/*` to the builds in `dist` (`skipLibCheck`: their declarations declare the global `Signal` several times): the editor needs `npm run build:projects` once; the specs and `typecheck:projects` use `tsconfig.spec.json`/`tsconfig.typecheck.json` on the sources.
- The specs run in the `directives` project of the root Vitest, whose `createBabelPlugin` (`packages/cli/src/utils/babel-plugin`) transpiles the decorators as `xd test` does. `*.directive.ts` stays out of the coverage: Babel gives each `accessor` a setter that `@Property` replaces, never called. The behavior lives in `utils/element-animation` (`enterElement`, `leaveElement`), tested there; the class reads its inputs, and registers `onLeave` only when `leave` holds an animation as it starts.
- `enter` on the server (no `getComputedStyle`) only adds the class, so the browser animates the HTML of the server; in the hydration `playClass` finds the class, which restarts nothing, and waits for its end. `leave` goes through `onLeave` of core, a no-op on the server.
- The end of a CSS animation is `AnimationEnd` (`models/animation-end`): the events of the element itself, the longest `elapsedTime`, a cancel, or the CSS times (`readAnimationTimes`) plus `END_MARGIN`.
