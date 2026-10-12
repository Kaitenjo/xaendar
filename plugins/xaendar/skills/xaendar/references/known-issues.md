# Known issues

Verified bugs and limitations of the framework and its tools (Xaendar 0.12), with workarounds. Check here before assuming generated code or a template is wrong.

## Build

### Handled errors are printed as [Unhandled error] (Vite)

When an agent starts the dev server (`AI_AGENT`, `CLAUDECODE`, …), Vite's `server.forwardConsole` sends every error reaching `window` to the terminal, even when a listener calls `preventDefault()`.

**Workaround:** Ignore it, it is not a Xaendar error; or set `server.forwardConsole: false` in `vite.config.ts`.

## CLI

### Style options the plugin cannot compile (uncomplete feature)

xd new accepts scss, less and styl, which the plugin rejects; xd generate component ignores xaendar.json and always writes CSS.

**Workaround:** Use css.

## Docs

### Documentation inside the packages is out of date (docs)

The README of core mentions attributeChangedCallback, InputSignal<a, b> and .get(); the README of signals imports effect from @xaendar/signals and says that two synchronous sets run an effect twice; the JSDoc of onCleanup says it runs before each re-run; the JSDoc of signal() defaults to any; QuerySlotOptions mentions slot; the @for alias is documented as $index = i.

**Workaround:** Trust this site: every behavior here was observed.
