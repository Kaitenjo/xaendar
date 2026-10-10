# Error messages

Messages printed by the Xaendar compiler, build, runtime and CLI, with cause and fix. Search this file for the text of the message (positions and paths are omitted).

## Lexer

### `[Lexer] Unknown flow-control keyword`

- **Cause:** An @ in text starts a block: a keyword written without a space before its parenthesis (@if(…)), a keyword that does not exist (@unless, @empty), or a plain @, as in an email address.
- **Fix:** Write a space after the keyword, and an interpolation such as { '@' } for a literal @.

### `[Lexer] Unexpected character 'p' after '/': expected '>' to close self-closing tag`

- **Cause:** A literal < in text, as in 1 < 2, is read as the start of a tag.
- **Fix:** Write { '<' }.

### `[Lexer] Attribute value must start with double quotes '"'`

- **Cause:** An attribute value in single quotes, or without quotes.
- **Fix:** Use double quotes for every attribute value.

### `[Lexer] Event must be included in Double Quotes`

- **Cause:** A listener with a nested call or an expression as argument, such as go(n()) or go(n() + 1), or with two statements.
- **Fix:** Call a single method, with literals, members, loop variables, property accesses or $event as arguments, and compute the rest in the method.

### `[Lexer] Event handler cannot be empty`

- **Cause:** An arrow function as listener, such as (click)="() => go()".
- **Fix:** Name a method: (click)="go()".

### `[Lexer] No spaces are allowed in event handler name`

- **Cause:** An assignment as listener, such as (click)="open = true".
- **Fix:** Move the assignment into a method.

### `[Lexer] Expected { after @import`

- **Cause:** A default import: @import Card from …
- **Fix:** Use a named import: @import { Card } from …

### `[Lexer] Directives cannot be declared inside another directive`

- **Cause:** A directive written inside the parentheses of another one.
- **Fix:** Write the directives one after the other on the tag.

### `[Lexer] The properties of a structural directive cannot be bound conditionally`

- **Cause:** An @if or @switch inside the parentheses of a structural directive.
- **Fix:** Apply the whole directive inside the condition, once per branch.

### `[Lexer] Structural directives cannot listen to events: they hold no element to dispatch them on`

- **Cause:** A listener inside the parentheses of a structural directive.
- **Fix:** Write the listener on the tag, outside the directive.

## Parser

### `[Parser] Expected closing tag input while file is over`

- **Cause:** An element never closed: a void element without />, an unclosed template literal, an interpolation such as { '{' }, or an expression starting with a backtick after a space.
- **Fix:** Self-close void elements (<input />), use { '\x7B' } for a brace, and write a template literal right after the brace.

### `[Parser] Expected closing tag div, found DIV`

- **Cause:** A closing tag written with a different case.
- **Fix:** Write opening and closing tags the same way.

### `[Parser] No transition function for token of type ELSE`

- **Cause:** An @else not following an @if block.
- **Fix:** Put the @else right after the closing brace of the @if.

### `[Parser] Attribute value missing for hidden in: hidden`

- **Cause:** A valueless attribute right before a structural directive, or an attribute bound to an expression starting with a backtick after a space.
- **Fix:** Move the attribute after the directive, or give it an empty value; write the backtick right after the brace.

### `[Parser] Attribute "title" is bound more than once on <p>`

- **Cause:** The same attribute written both outside and inside a conditional binding.
- **Fix:** Bind it only inside the condition, in every branch that needs it.

### `[Parser] Directive "exTint" is applied more than once on <p>`

- **Cause:** The same directive applied twice to one element.
- **Fix:** Apply it once; switch its inputs with a condition if needed.

### `[Parser] 'user(); as u' must be a single expression, got '; as u' after 'user()'.`

- **Cause:** More than one expression where one is expected, as in @if (x; as y) or a; b.
- **Fix:** Write a single expression; read the value again inside the block.

### `[Parser] 'FirstAssignment' is not allowed inside template expressions.`

- **Cause:** A construct forbidden in expressions. The same message names the others: 'new', function expressions, 'ThisKeyword', 'AsExpression', 'RegularExpressionLiteral', 'CommaToken'.
- **Fix:** Move the logic into a method or a computed signal of the class.

### `[Parser] 'let i' is not a valid alias identifier.`

- **Cause:** An alias of @for written with let.
- **Fix:** Write the alias as i = $index.

## TypeChecker

### `[TypeChecker] foreign-thing selector is not associated to any WebComponent imported in the template`

- **Cause:** A tag with a dash that is not a Xaendar component imported by the template: a missing @import, or a custom element of another library.
- **Fix:** Import the component; create elements of other libraries in code.

### `[TypeChecker] @@exTint selector is not associated to any Directive imported in the template`

- **Cause:** A directive used without @import.
- **Fix:** Import the directive class in the template.

### `[TypeChecker] x-card is missing the following required properties: ● name`

- **Cause:** A required input not bound.
- **Fix:** Bind it on the tag.

### `[TypeChecker] Required property "name" of <x-card> must always be bound: bind it in every branch of its conditional binding, including an @else or @default one, or outside of it.`

- **Cause:** A required input bound only in some branches.
- **Fix:** Add an @else or @default branch binding it, or bind it outside the condition.

### `[TypeChecker] Unknown event "valuechange" on <x-picker> (XPicker has no @Event with this name).`

- **Cause:** A listener for an event the component does not declare: a different case, or a native event such as click on a component tag.
- **Fix:** Match the name of the accessor; listen to native events on a wrapper element.

### `[TypeChecker] Unknown property "shade" on @@exTint (TintDirective has no @Property with this name).`

- **Cause:** An input the directive does not declare.
- **Fix:** Use the name of a @Property of the directive.

### `Property 'bubbly' does not exist on type 'HTMLElementEventMap'.`

- **Cause:** A listener for an unknown event on a native element.
- **Fix:** Listen to custom events on the component emitting them, or on a component re-emitting them.

### `Type 'string' does not satisfy the expected type 'number'.`

- **Cause:** A static value, always a string, bound to an input of another type.
- **Fix:** Bind an expression: count="{ 3 }".

### `Cannot find name '$event'. Did you mean 'event'?`

- **Cause:** $event used for an output without a type argument, or as $event.target.
- **Fix:** Give the output a type, such as Output<string>; pass $event whole and read the target in the method.

### `Property 'secret' is private and only accessible within class 'XCard'.`

- **Cause:** A private or protected member read by the template.
- **Fix:** Make the member public.

### `Property 'LIMIT' does not exist on type 'XCard'.`

- **Cause:** A module constant read by the template, which only sees the members of the class.
- **Fix:** Expose it as a member: readonly limit = LIMIT.

### `This comparison appears to be unintentional because the types '1' and '2' have no overlap.`

- **Cause:** A readonly member initialized with a literal has a literal type, and the template is checked with it.
- **Fix:** Annotate the member with a wider type.

### `Argument of type 'Set<number>' is not assignable to parameter of type 'number | readonly unknown[]'.`

- **Cause:** @for over something that is neither an array nor a number: a Set, a Map, a string.
- **Fix:** Convert it to an array, for instance in a computed signal.

### `'this' implicitly has type 'any' because it does not have a type annotation.`

- **Cause:** A track expression reading a member of the component.
- **Fix:** Track by a field of the item, or by the item itself.

### `Property '$count' does not exist on type 'XList'.`

- **Cause:** $count is not one of the variables of @for.
- **Fix:** Read the length of the list.

### `Cannot find name 'first'.`

- **Cause:** A member of the component as the value of an @case, which only accepts literals.
- **Fix:** Write the literal, or use @if.

### `'root.prices.coffee' is possibly 'undefined'.`

- **Cause:** The strict options of tsconfig.json, such as noUncheckedIndexedAccess, apply to templates too.
- **Fix:** Use ?. or ??, or a precise type.

## Generator

### `[Generator] Signal field "step" is already declared in this scope.`

- **Cause:** A signal member declared both by a class and by the class it extends.
- **Fix:** Declare it once; in the base class, type it as a function.

## Build

### `Invalid custom element name "laberr" in component <path>`

- **Cause:** A selector that is not a valid custom element name.
- **Fix:** Use lowercase letters and at least one dash.

### `Selector "x-card" of component "A" - <path> is already used by component "B" - <path>. Custom element names must be unique.`

- **Cause:** Two components with the same selector.
- **Fix:** Rename one of them.

### `Selector "exTint" of directive "A" - <path> is already used by directive "B" - <path>. Directive selectors must be unique.`

- **Cause:** Two directives with the same selector.
- **Fix:** Rename one of them, ideally with a prefix.

### `Could not find template at <path>`

- **Cause:** A templateUrl pointing to a missing file.
- **Fix:** Fix the path, relative to the file of the component.

### `Unsupported stylesheet extension ".scss" for <path>.`

- **Cause:** A styleUrl that is not a .css file.
- **Fix:** Use plain CSS.

### `Could not find the static initializer block for class "MyAppRootComponent" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.`

- **Cause:** The decorators were not compiled before the Xaendar plugin ran.
- **Fix:** Put the Babel plugin before xaendarPlugin().

### `Error: Unable to resolve module path for "Nope".`

- **Cause:** An @import whose path does not resolve: only relative paths to files or folders are supported.
- **Fix:** Use a relative path; packages and tsconfig aliases are not resolved.

### `Class "Callout" was not found in the import from <path>`

- **Cause:** An @import naming a class the file does not declare, or a type.
- **Fix:** Import the component or directive class by its exact name.

### `Unterminated string constant`

- **Cause:** Reported by Babel on the generated code for an interpolation such as { '}' }: the brace inside the string ends the interpolation.
- **Fix:** Write { '\x7D' }.

## Runtime

### `XCard does not seems to have a Render Function`

- **Cause:** The template of the component did not compile, its templateUrl is not a string literal, its file does not end with .xd.component.ts, or the class is a subclass without its own @WebComponent.
- **Fix:** Look for the compiler message printed before it.

### `ReferenceError: Signal is not defined`

- **Cause:** loadSignals() did not run before @xaendar/core was loaded.
- **Fix:** Call it in a module loaded before the application.

### `Error: No directive registered for selector "exTint"`

- **Cause:** The template imports the directive, but its module was never loaded at runtime.
- **Fix:** Import the module, for instance with the glob of main.ts.

### `Error: Directive TintDirective registered for selector "exTint" is not a StructuralDirective`

- **Cause:** A custom directive applied with *, or a structural one with @@.
- **Fix:** Use @@ for CustomDirective and * for StructuralDirective.

### `Error: Selector "exTint" is already used by directive TintDirective`

- **Cause:** Two directive classes registered with the same selector.
- **Fix:** Rename one of them.

### `TypeError: Cannot read properties of undefined (reading 'addUnlistener')`

- **Cause:** this.effect called in the constructor of a directive, before its context exists.
- **Fix:** Create effects in onInit.

### `TypeError: Cannot read properties of undefined (reading 'bind')`

- **Cause:** A listener calling a method of a member, such as (click)="helper.run()": it compiles, and fails at the click.
- **Fix:** Call a method of the component, which calls the helper.

### `TypeError: stop is not a function`

- **Cause:** A query created with query() after the component was connected, thrown at the next disconnection.
- **Fix:** Create queries in field initializers.

### `ReferenceError: DEFAULT_LEVEL is not defined`

- **Cause:** An input whose default is not a literal, bound conditionally by a parent: the default is copied into the code of the parent.
- **Fix:** Write the default as a literal.

### `NotSupportedError: Failed to execute 'define' on 'CustomElementRegistry': the name "x-card" has already been used with this registry`

- **Cause:** Two classes defined with the same selector at runtime.
- **Fix:** Rename one of them.

### `NotSupportedError: Failed to execute 'attachShadow' on 'Element': Shadow root cannot be created on a host which already hosts a shadow tree.`

- **Cause:** attachShadow called by a component, which already has an open shadow root.
- **Fix:** Use this.shadowRoot.

### `@import rules are not allowed here.`

- **Cause:** A browser warning: a component stylesheet is a constructed stylesheet, which drops @import rules.
- **Fix:** Put every rule in the CSS file of the component.

## Signals

### `Circular dependency detected while computing a Computed signal`

- **Cause:** A computed signal reading itself, directly or through others.
- **Fix:** Break the cycle with a writable signal.

### `Cannot set value while signals are frozen`

- **Cause:** A signal written, or read (Cannot get value…), inside watched, unwatched or Watcher.notify.
- **Fix:** Defer the work with queueMicrotask.

### `Cannot unwatch a signal that is not being watched`

- **Cause:** The disposer of a standalone effect called twice.
- **Fix:** Call it once.

### `TypeError: signal.getSinks is not a function`

- **Cause:** Signal.subtle.introspectSinks given the function returned by signal() or computed().
- **Fix:** Use Signal.State and Signal.Computed for introspection.

## CLI

### `error: unknown command 'generate'`

- **Cause:** The component command is registered at the top level.
- **Fix:** Run xd component <name>, or xd c <name>.

### `Tag <Widget> is not a valid custom element name. Custom element names must: …`

- **Cause:** A component name, or a project name followed by -root, that is not a valid custom element name.
- **Fix:** Use lowercase letters and a dash.

### `Tag <font-face> is a reserved tag name and cannot be used as a custom element name.`

- **Cause:** One of the names reserved by the HTML specification.
- **Fix:** Pick another name.

### `✖  Directory "user-card" already exists.`

- **Cause:** xd component would overwrite an existing folder.
- **Fix:** Pick another name, or add --force to replace it.

### `✖  Invalid style option: sass`

- **Cause:** xd new accepts css, scss, less and styl.
- **Fix:** Use css: it is the only extension the plugin compiles.
