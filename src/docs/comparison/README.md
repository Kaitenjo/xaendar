# Framework comparison

The same page written with Angular, Lit, React and Xaendar, measured for the **Reference → Framework comparison** page of
the documentation, which links them. Each folder is its own npm project, with its own `package.json`,
`node_modules`, toolchain and build, exactly as a reader's application would be.

- `shared` holds what the four pages have in common, so that only the rendering code changes: the data (1,000
  employees from a fixed seed) and the filtering function, the CSS of the page, of the button and of the fields.
- `angular`, `lit`, `react` and `xaendar` are split the same way: four small components (a button, a text field, a date
  field, a select) and a page holding the filters being edited, the filters applied and the table, whose rows are
  selected by a click and whose salaries **Raise 5%** raises (`raiseSalaries` of `shared/data.ts`, new rows).
- Each page uses the optimizations its framework offers, so that an update renders only what changed: Angular is
  zoneless, with `OnPush` components, signals and `track`; Lit keys the rows (`repeat`), computes them again only
  when the data or the applied filters change (`willUpdate`) and writes to the page only the bindings whose value
  changed; React memoizes its components (`memo`, with the table and its rows as components of their own) and keeps
  its callbacks stable (`useCallback`, `useMemo`).
- Every page builds into `../public/comparison/<name>/`, which is **generated and not committed** (`.gitignore`).
  Build them once after a clone, and again whenever you change one: otherwise the links of the page lead nowhere,
  and `npm start` and `npm run build` of the site say so instead of failing.
- The Xaendar page is built with the `xd` CLI and the sources of the packages in this repository, not with a
  published version.

## Commands

```bash
npm run build:comparison                  # from src/docs: install (when needed) and build the four pages
node comparison/build.mjs react xaendar   # only these
node comparison/build.mjs --check         # report which ones are missing (what prestart/prebuild run)
```

## Measuring

`measure.mjs` measures the four builds as the documentation reports them, and writes the figures its page shows
(`src/pages/reference/framework-comparison/framework-comparison.results.json`). The page explains each step; in short:

- the JavaScript of each build, minified and with gzip (level 9), read from the files;
- every run opens one page in a new context of a headless Chromium (Playwright), served by a local static server, at
  CPU 1× and 4× (CDP throttling);
- startup: from the navigation to the first frame showing the 1,000 rows; memory after a forced garbage collection
  (`Runtime.getHeapUsage`, `Memory.getDOMCounters`, and the whole memory of the page, JavaScript, DOM and the rest, by
  `performance.measureUserAgentSpecificMemory()`, which is why the server isolates the pages from other origins and
  the script runs the full Chromium rather than its headless shell); then, in this order, the time of selecting row
  500 (one class changes), **Raise 5%** (a text changes in every row), **Apply** (department `Engineering`, 132 rows)
  and **Reset**, each from the click to the first task after the frame showing the change;
- the elements of the page and the rows the filter leaves, to check that the four pages do the same work;
- the pages take turns run after run, and every figure is the median of its runs.

```bash
npm install --no-save playwright && npx playwright install chromium   # once: Playwright is not a dependency
node comparison/measure.mjs --runs=10 --json=src/pages/reference/framework-comparison/framework-comparison.results.json
```

Measure again after changing a page or a framework version, on a machine doing nothing else.
