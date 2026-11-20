# Framework comparison

The same page written with Angular, React and Xaendar, embedded with three iframes in the **Reference → Framework
comparison** page of the documentation. Each folder is its own npm project, with its own `package.json`,
`node_modules`, toolchain and build, exactly as a reader's application would be.

- `shared` holds what the three pages have in common, so that only the rendering code changes: the data (1,000
  employees from a fixed seed) and the filtering function, the CSS of the page, of the button and of the fields,
  and the telemetry panel.
- `angular`, `react` and `xaendar` are split the same way: four small components (a button, a text field, a date
  field, a select) and a page holding the filters being edited, the filters applied and the table.
- Every page builds into `../public/comparison/<name>/`, which is **generated and not committed** (`.gitignore`).
  Build them once after a clone, and again whenever you change one: otherwise the frames of the page stay empty,
  and `npm start` and `npm run build` of the site say so instead of failing.
- The Xaendar page is built with the `xd` CLI and the sources of the packages in this repository, not with a
  published version.

## Commands

```bash
npm run build:comparison                  # from src/docs: install (when needed) and build the three pages
node comparison/build.mjs react xaendar   # only these
node comparison/build.mjs --check         # report which ones are missing (what prestart/prebuild run)
```

## The telemetry panel

`shared/telemetry.ts` mounts the panel in a shadow root of its own, outside the application, so that it is the
same in the three pages and its styles cannot leak into them. It can be dragged by its header, collapsed and
configured (sections, sampling interval, entries listed); its settings are kept in `localStorage`.

- **Startup**: the time to the first rows of the table, the JavaScript downloaded and the elements of the page.
- **Interactions**: every `click` and `input`, with the time to the next animation frame (the framework has
  updated the DOM) and to the frame after it (style, layout and paint included). `change` is left out: it is
  not composed, so it never leaves the shadow roots of the Xaendar fields.
- **Long frames**: the Long Animation Frames over 50 ms, with their longest script (Chromium 123+).
- **Memory**: the JavaScript heap from `performance.memory` (Chromium only), and the memory of the whole page
  from `performance.measureUserAgentSpecificMemory()` when the page is cross-origin isolated.
  `public/_headers` sends the COOP/COEP headers for `/comparison/*` on Cloudflare, so a page opened in its own
  tab is isolated; the dev server does not send them.

The frames of the documentation page share one thread and one heap with each other and with the documentation:
compare the figures of pages opened in their own tabs.
