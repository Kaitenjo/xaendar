# Known issues

Verified bugs and limitations of the framework and its tools (Xaendar 0.12), with workarounds. Check here before assuming generated code or a template is wrong.

## Compiler

### Inherited inputs and outputs are ignored by the type checker (bug)

An @Event declared by a base class is reported as unknown on the tag of the subclass, and an inherited @Property is not type-checked.

**Workaround:** Declare inputs and outputs in the decorated class.

### A signal declared again in a subclass breaks the template (bug)

The signal is listed twice: [Generator] Signal field "x" is already declared in this scope. Unlike other template errors, it stops xd build.

**Workaround:** In the base class, type the member as a function.

### A non-literal default is copied into the parent (bug)

When a parent binds an input conditionally, the default written in @Property is pasted into the code of the parent, where the names it uses are undefined: ReferenceError at render.

**Workaround:** Write defaults as literals.

### A listener calling a method of a member fails at runtime (bug)

(click)="helper.run()" compiles, then throws TypeError: Cannot read properties of undefined (reading 'bind') at the click.

**Workaround:** Call a method of the component.

### An expression starting with a backtick after a space (bug)

{ `text` } in text or in an attribute is not parsed: Expected closing tag, or Attribute value missing.

**Workaround:** Write the backtick right after the brace, or start with another operand.

### Braces inside strings of an interpolation (bug)

The braces are counted even inside strings: { '}' } produces invalid code (Unterminated string constant), { '{' } an unclosed element.

**Workaround:** Use { '\x7B' } and { '\x7D' }; balanced braces are fine.

### Nested template literals (bug)

A template literal inside another one is rejected as more than one expression, with a duplicated backtick in the message.

**Workaround:** Build the inner string in a method.

### An unclosed comment truncates the template silently (bug)

Everything after <!-- without --> disappears, with no error.

**Workaround:** Close every comment.

### A valueless attribute before a structural directive (bug)

<span hidden *dir(…)> fails with Attribute value missing for hidden.

**Workaround:** Write the attribute after the directive, or as hidden="".

### HTML inside foreignObject is created as SVG (bug)

The children of <foreignObject> stay in the SVG namespace, so the browser does not render them as HTML.

**Workaround:** Position HTML over the SVG with CSS, or create it in code.

### A space between two interpolations disappears (bug)

{ first } { second } renders the two values joined.

**Workaround:** Write {`${first} ${second}`}, or put other text between them.

### A shorthand object in an interpolation renders nothing (bug)

{ {b} } compiles, and renders an empty text.

**Workaround:** Write the object in full, or format it in a method.

### Newlines are removed and entities are not decoded (limitation)

A line break in text joins the words around it, and &lt; is shown as written. Text cannot contain a literal @, { or <.

**Workaround:** Indent wrapped lines, and use interpolations such as { '@' } and Unicode characters.

### Signal members are detected by syntax (limitation)

An attribute is reactive only if it names a member initialized by a function of @xaendar/core/signals, or annotated with one of its types. A module signal assigned to an unannotated member, or a member initialized by another function such as queryAll, is read once.

**Workaround:** Annotate the member with Signal<T> or Computed<T>, or wrap it in computed().

### A method reading signals is evaluated once in an attribute (limitation)

In text, any expression is reactive; in an attribute, only one naming a signal member.

**Workaround:** Turn the method into a computed signal.

### Members named history or location (limitation)

In a template, these names resolve to the globals of the browser, even when the component declares them.

**Workaround:** Pick other names.

### Output without a type: no $event (limitation)

The listener of an Output with no type argument cannot use $event, so it cannot cancel or inspect the event.

**Workaround:** Give the output a type, even a simple one.

### Every tag with a dash must be an imported Xaendar component (limitation)

Custom elements of other libraries are rejected by the type checker, and so are native events on the tag of a component.

**Workaround:** Create foreign elements in code; listen to native events on a wrapper.

## Runtime

### A child is rendered before the bindings of its parent (bug)

In onInit, and in the first render, inputs hold their defaults and required ones are undefined. An exception in the first run of a binding stops the rest of the template of the child for good. Events emitted in onInit or afterRender are lost.

**Workaround:** Read inputs reactively, use ?. on required ones, and emit after a microtask.

### Rows of @for keep the item they were created with (bug)

A new object with the same key does not update its row, and track $index shows stale rows when items are prepended. Duplicate keys corrupt the list.

**Workaround:** Track by identity, or keep the changing fields in signals; use unique keys.

### @switch evaluates its expression once per case (bug)

The expression runs again for each @case until one matches: side effects and costly calls are repeated.

**Workaround:** Switch over a signal or a computed signal.

### A query created after the connection (bug)

query() called after the component is connected stays null until the next connection, and the next disconnection throws TypeError: stop is not a function, skipping the other hooks.

**Workaround:** Create queries in field initializers.

### An effect created in the constructor dies at the first disconnection (bug)

Effects created in field initializers or in the constructor are disposed when the component is disconnected, and never created again.

**Workaround:** Create effects in onInit or afterRender.

### A detail with option keys is taken for options (bug)

emit({ bubbles: true, value: 1 }) dispatches an event with a null detail, and bubbles set to true.

**Workaround:** Wrap the detail in another object.

### input() deletes the transform of its options (bug)

The options object passed to input() loses its transform: reused for a second input, it applies none. @Property is not affected, since it builds a new object each time.

**Workaround:** Pass a new options object to each call.

## Signals

### untracked does not survive a computed evaluated inside it (bug)

After a computed signal is evaluated inside untracked, the following reads are tracked again by the outer effect.

**Workaround:** Use one untracked per read.

### An unwatched computed signal is evaluated at every read (bug)

Without an effect or a watcher depending on it, the cache of a computed signal is not used.

**Workaround:** Read costly computed signals from effects or templates.

### watched and unwatched fire on every run of the only dependent (bug)

The sinks are removed before each recomputation, so a signal with one dependent is unwatched and watched again every time it runs. computed() ignores both callbacks.

**Workaround:** Make the callbacks idempotent; use Signal.Computed for computed ones.

### signal() and computed() are not instances of the proposal classes (bug)

They return wrapper functions: instanceof Signal.State is false, and Signal.subtle.introspectSinks throws signal.getSinks is not a function.

**Workaround:** Use Signal.State and Signal.Computed for introspection.

## Build

### Template errors do not fail the build (bug)

xd build exits with 0, and the component reaches the bundle without a render function.

**Workaround:** Fail the pipeline on the Xaendar: messages.

### Classes are not type-checked (limitation)

Only templates are checked: members clashing with HTMLElement, such as title, lang, remove or matches, go unnoticed.

**Workaround:** Run tsc --noEmit too.

### The dev server keeps stale metadata (bug)

After changing the type of an input or output, the templates using it are still checked against the old one, and a page created before its template stays without a render function, until the server restarts.

**Workaround:** Restart xd start.

### The dev overlay reports handled errors (bug)

Vite prints [Unhandled error] even for errors handled with preventDefault on window.

**Workaround:** None: it happens in development only.

## CLI

### xd generate does not exist (bug)

The component command is registered at the top level instead of inside generate.

**Workaround:** Run xd component, or xd c.

### Style options the plugin cannot compile (bug)

xd new accepts scss, less and styl, which the plugin rejects; xd component ignores xaendar.json and always writes CSS.

**Workaround:** Use css.

### The project name is checked too late (bug)

xd new MyApp writes most of the project before rejecting MyApp-root, and never installs the dependencies.

**Workaround:** Use a lowercase name with a dash, and delete the half-made folder.

### The generated spec does not run (bug)

npm test runs Vitest without the decorators transform: SyntaxError: Invalid or unexpected token.

**Workaround:** Configure Vitest with the same plugins and a DOM environment.

### The published packages predate this documentation (bug)

The 0.12.0 packages on npm export BaseWebComponent, not CustomElement: a project generated by a CLI built from the repository fails with MISSING_EXPORT.

**Workaround:** Work inside the repository until the next release.

## Editor

### The language server never compiles a template (bug)

The index mapping templates to components is never filled, so diagnostics and completions are never produced. Hover is announced but not implemented.

**Workaround:** Read the errors in the terminal of xd start.

### The grammar highlights {{ }} instead of { } (bug)

Interpolations and directives keep the colors of plain HTML.

**Workaround:** None yet.

## Docs

### Documentation inside the packages is out of date (docs)

The README of core mentions attributeChangedCallback, InputSignal<a, b> and .get(); the README of signals imports effect from @xaendar/signals and says that two synchronous sets run an effect twice; the JSDoc of onCleanup says it runs before each re-run; the JSDoc of signal() defaults to any; QuerySlotOptions mentions slot; the @for alias is documented as $index = i.

**Workaround:** Trust this site: every behavior here was observed.
