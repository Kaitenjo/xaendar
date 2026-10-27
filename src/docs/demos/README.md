# Demo applications

One standalone application per framework, embedded in the **Tools → Integrations** page of the documentation
with an iframe. They are not part of the documentation site: each one is its own npm project, with its own
`package.json`, `node_modules`, toolchain and build, exactly as a reader's application would be.

- `qty-picker` is the Xaendar component they all embed, built with Vite in library mode into one ES module with
  the Xaendar runtime bundled in. Every application depends on it through a `file:` link and needs no Xaendar
  dependency of its own: this is the "separate bundle" path the page describes.
- Every other folder is an application. Each builds into `../public/demos/<name>/`, which is **generated and
  not committed** (`.gitignore`): only the sources in this folder are. Build them once after a clone, and
  again whenever you change one — otherwise the frames of the page stay empty, and `npm start` and
  `npm run build` of the site say so instead of failing.

Building them all installs eleven toolchains, which takes several minutes and a good deal of disk. Nothing
else in the repository depends on them, so you can leave them unbuilt while you work on another page.

## Commands

```bash
npm run build:demos                      # from src/docs: install (when needed) and build them all, then verify
node demos/build.mjs react vue           # only these
node demos/build.mjs --check             # report which ones are missing (what prestart/prebuild run)
node demos/verify.mjs react vue          # only check what is already built
```

`verify.mjs` serves a built application over HTTP, loads it in a headless DOM, calls the component's
`setValue(5)` and clicks its `+` button, and fails unless the quantity and the application's own state follow.
It is what proves the integration still works, so keep it passing rather than adjusting it.

## What every application does

The same panel: the `<ex-qty-picker>` element, a line showing the application's own state, and a button that
adds 5 to that state. The point is the boundary, so each one must respect it:

- never set an input on the element — attributes are ignored and assigning the property destroys the signal;
  send data in with its public method `setValue(value)`;
- read data out from the `changed` event on the element itself, which does not bubble;
- call `defineQtyPicker()` before the tag is rendered, and never on the server.
