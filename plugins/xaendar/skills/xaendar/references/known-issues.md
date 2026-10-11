# Known issues

Verified bugs and limitations of the framework and its tools (Xaendar 0.12), with workarounds. Check here before assuming generated code or a template is wrong.

## Compiler

### Members named history or location (limitation)

In a template, these names resolve to the globals of the browser, even when the component declares them.

**Workaround:** Pick other names.

### Output without a type: no $event (limitation)

The listener of an Output with no type argument cannot use $event, so it cannot cancel or inspect the event.

**Workaround:** Give the output a type, even a simple one.

### Every tag with a dash must be an imported Xaendar component (limitation)

Custom elements of other libraries are rejected by the type checker, and so are native events on the tag of a component.

**Workaround:** Create foreign elements in code; listen to native events on a wrapper.

## Build

### Classes are not type-checked (limitation)

Only templates are checked: members clashing with HTMLElement, such as title, lang, remove or matches, go unnoticed.

**Workaround:** Run tsc --noEmit too.

### The dev overlay reports handled errors (bug)

Vite prints [Unhandled error] even for errors handled with preventDefault on window.

**Workaround:** None: it happens in development only.

## CLI

### Style options the plugin cannot compile (uncomplete feature)

xd new accepts scss, less and styl, which the plugin rejects; xd generate component ignores xaendar.json and always writes CSS.

**Workaround:** Use css.

## Docs

### Documentation inside the packages is out of date (docs)

The README of core mentions attributeChangedCallback, InputSignal<a, b> and .get(); the README of signals imports effect from @xaendar/signals and says that two synchronous sets run an effect twice; the JSDoc of onCleanup says it runs before each re-run; the JSDoc of signal() defaults to any; QuerySlotOptions mentions slot; the @for alias is documented as $index = i.

**Workaround:** Trust this site: every behavior here was observed.
