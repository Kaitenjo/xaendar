# Error messages

Messages printed by the Xaendar compiler, build, runtime and CLI, with cause and fix. Search this file for the text of the message (positions and paths are omitted).

## Lexer

### `[Lexer] Unknown flow-control keyword`

- **Cause:** An @ in text starts a block: a keyword written without a space before its parenthesis (@if(…)), a keyword that does not exist (@unless, @empty), or a plain @, as in an email address.
- **Fix:** Write a space after the keyword, and &commat; or an interpolation such as { '@' } for a literal @.

### `[Lexer] Comment never closed: '<!--' without '-->'`

- **Cause:** An HTML comment opened with <!-- and never closed.
- **Fix:** Close the comment with -->.

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
- **Fix:** Use a named import: @import { Card } from …, or @import { default as Card } from … for a default export.

### `[Lexer] Directives cannot be declared inside another directive`

- **Cause:** A directive written inside the parentheses of another one.
- **Fix:** Write the directives one after the other on the tag.

### `[Lexer] The properties of a structural directive cannot be bound conditionally`

- **Cause:** An @if or @switch inside the parentheses of a structural directive.
- **Fix:** Apply the whole directive inside the condition, once per branch.

### `[Lexer] Structural directives cannot listen to events: they hold no element to dispatch them on`

- **Cause:** A listener inside the parentheses of a structural directive.
- **Fix:** Write the listener on the tag, outside the directive.

### `[Lexer] A template variable takes no value: write #name, which names the element it is declared on`

- **Cause:** A value given to a template variable, as in #field="name".
- **Fix:** Write #field alone: it names the element it is declared on.

### `[Lexer] A template variable names the element whatever branch is selected: declare #name among the bindings of the tag, outside of its conditional bindings`

- **Cause:** A #name inside the block of a conditional binding, or inside the parentheses of a directive (… outside of its directives).
- **Fix:** Declare the variable directly on the tag.

### `[Lexer] Only a <template> declares parameters, e.g. <template #row(item: Item)>: on any other element a template variable is just #name`

- **Cause:** Parentheses after the name of a template variable on an element other than a <template>.
- **Fix:** Write #name alone.

### `[Lexer] @render calls a template by its name, followed by its arguments in parentheses, e.g. @render row(item())`

- **Cause:** A @render without the name of the template, without parentheses, or with a space or a dot between the name and the parentheses.
- **Fix:** Write @render name(arguments), with () when the template has no parameters.


### `[Lexer] @let declares a name and its value, ending with a semicolon, e.g. @let address = user().address;`

- **Cause:** A @let without its name or its =, or whose block closes before its ;. The same message is reported as [Parser] when the template ends before the ;, or the value is missing.
- **Fix:** Write @let name = value; with a ; ending the value.
## Parser

### `[Parser] Expected closing tag input while file is over`

- **Cause:** An element never closed: a void element without />, or a string or template literal never closed in an interpolation.
- **Fix:** Self-close void elements (<input />), and close every string and template literal.

### `[Parser] Expected closing tag div, found DIV`

- **Cause:** A closing tag written with a different case.
- **Fix:** Write opening and closing tags the same way.

### `[Parser] No transition function for token of type ELSE`

- **Cause:** An @else not following an @if block.
- **Fix:** Put the @else right after the closing brace of the @if.

### `[Parser] Attribute "title" is bound more than once on <p>`

- **Cause:** The same attribute written both outside and inside a conditional binding.
- **Fix:** Bind it only inside the condition, in every branch that needs it.

### `[Parser] Class "on" is bound more than once on <p>`

- **Cause:** The same [class.name] written twice on an element, or both outside and inside a conditional binding.
- **Fix:** Toggle it once, combining the conditions in its expression, or in every branch of one condition.

### `[Parser] [class.on] toggles the class by the value of an expression: [class.on]="{expression}"`

- **Cause:** A class binding with a static value, or without a value.
- **Fix:** Bind it to an expression in braces: [class.on]="{ active() }".

### `[Parser] "[style.color]" is not a binding: a class is toggled with [class.name]="{expression}"`

- **Cause:** An attribute name in brackets other than [class.name]: brackets only toggle classes.
- **Fix:** Bind the attribute without brackets, e.g. style="{ … }", or toggle a class with [class.name].

### `[Parser] [class.on] cannot be bound inside a directive: bind it on the element`

- **Cause:** A class binding in the parentheses of a directive, or in a conditional binding inside them, which only bind the properties of the directive.
- **Fix:** Move it among the bindings of the element.

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

### `[Parser] <input> declares more than one template variable (#first, #second): an element has a single name`

- **Cause:** Two template variables on the same element.
- **Fix:** Keep one name per element.

### `[Parser] <div> cannot declare #panel: its structural directives may not render it. Declare the variable on an element inside it, whose content is a scope of its own`

- **Cause:** A template variable on an element a structural directive is applied to, directly or by a conditional binding.
- **Fix:** Declare it on an element inside, or render the element with an @if and declare the variable inside the block.

### `[Parser] '2fields' is not a valid name for a template variable: it must be an identifier.`

- **Cause:** A template variable named by something other than an identifier; `'root' is reserved in templates` for root, $event and the names starting with __ or $$.
- **Fix:** Use an identifier the generated code does not reserve.


### `[Parser] '2total' is not a valid name for a @let: it must be an identifier.`

- **Cause:** A @let named by something other than an identifier; 'root' is reserved in templates is reported for root, $event and the names starting with __ or $$.
- **Fix:** Use an identifier the generated code does not reserve.
### `[Parser] A <template> declares a template: name it and list its parameters, e.g. <template #row(item: Item)>, then render it with @render row(item())`

- **Cause:** A <template> without #name(…): a <template> is always the declaration of a template.
- **Fix:** Name it and declare its parameters, then render it with @render.

### `[Parser] A template lists its parameters in parentheses after its name, even when it has none: <template #row()>`

- **Cause:** A <template #row> without parentheses.
- **Fix:** Write <template #row()>.

### `[Parser] A <template> declares only its name and its parameters, e.g. <template #row(item: Item)>: it renders nothing where it is declared, but where a @render calls it`

- **Cause:** An attribute, an event, a conditional binding, a directive or type arguments on a <template>.
- **Fix:** Move them to the elements inside the template.

### `[Parser] The parameters of a template are declared like the ones of a function, each one with its type, e.g. <template #row(item: Item, index: number)>`

- **Cause:** The parameters of a template with a missing or doubled comma, a semicolon, or anything but parameters.
- **Fix:** Separate the parameters with single commas: name: Type, name: Type.

### `[Parser] The parameter 'item' of template "row" needs a type or a default value, e.g. item: string or item = ''`

- **Cause:** A parameter with neither a type nor a default value. The same message ends with cannot destructure its value, cannot be a rest parameter, cannot be both optional and with a default value, cannot have modifiers or decorators, or, for an optional parameter, needs a type.
- **Fix:** Give each parameter a type, or a default value that gives it its type: name: Type, name = value, name: Type = value or name?: Type.

### `[Parser] The parameter 'index: number' of template "row" must be optional or have a default value, as 'dense = false' before it: a @render leaves out only the last arguments`

- **Cause:** A required parameter after an optional one or one with a default value: a @render can only leave out the last arguments.
- **Fix:** Move the required parameters first, or give this one a default value too.

### `[Parser] Template "row" declares the parameter "item" more than once`

- **Cause:** Two parameters with the same name.
- **Fix:** Rename one of them.

### `[Parser] '2row' cannot name a template: it must be an identifier`

- **Cause:** A @render whose name is not an identifier.
- **Fix:** Render the template by its name.

### `[Parser] @render passes each argument to its parameter: spread the values in separate arguments, e.g. @render row(pair()[0], pair()[1])`

- **Cause:** A spread argument (...values) in a @render.
- **Fix:** Pass one argument per parameter.

### `[Parser] The track expression of a @for reads the item and the implicit variables as signals: call it, e.g. track item()`

- **Cause:** A track expression that is the item or an implicit variable without parentheses: the key would be the signal, a new function every time, and no row would be reused.
- **Fix:** Call the signal: track item(), or track a property of it, as in track item().id.

## TypeChecker

### `[TypeChecker] foreign-thing selector is not associated to any WebComponent imported in the template, nor declared in customElements`

- **Cause:** A tag with a dash that is neither a Xaendar component imported by the template nor declared in customElements: a missing @import, or a custom element of another library.
- **Fix:** Import the component; declare the tags of other libraries in the customElements of xaendar.json.

### `[TypeChecker] sl-button is both imported as a WebComponent and declared in customElements`

- **Cause:** A tag that is a component imported by the template and also matches a pattern of customElements.
- **Fix:** Narrow the pattern to the tags of the other library, or rename the selector of the component.

### `[TypeChecker] @@exTint selector is not associated to any Directive imported in the template`

- **Cause:** A directive used without @import.
- **Fix:** Import the directive class in the template.

### `[TypeChecker] x-card is missing the following required properties: ● name`

- **Cause:** A required input not bound.
- **Fix:** Bind it on the tag.

### `[TypeChecker] Property "name" needs a value: write name="…" or name="{ expression }". An attribute without a value is only valid on a native element.`

- **Cause:** An input of a component or directive written like a boolean attribute (`<x-card name>`).
- **Fix:** Give it a value: `name="text"` or `name="{ expression }"`. The form without a value is only for the attributes of native elements (`<input disabled>`).

### `[TypeChecker] @@exList declares type arguments, but ListDirective is not generic.`

- **Cause:** Type arguments (`@@exList<Row>(…)`) on a directive whose class has no type parameters.
- **Fix:** Remove them, or add the type parameters to the class.

### `[TypeChecker] @@exList declares 3 type arguments, but ListDirective has 2 type parameters (Item, Key).`

- **Cause:** More type arguments than the class has type parameters.
- **Fix:** Pass at most one argument per type parameter, in their order.

### `The type arguments of a directive cannot be empty` / `A type argument of a directive cannot be empty`

- **Cause:** `@@exList<>(…)`, or an empty argument between two commas (`<Row,, number>`).
- **Fix:** Write the types, or drop the angle brackets.

### `The type arguments of a directive must be followed by its bindings between parentheses`

- **Cause:** Something other than `(` after the type arguments (`@@exList<Row>x`).
- **Fix:** Open the bindings right after the type arguments: `@@exList<Row>(items="{ rows() }")`.

### `[TypeChecker] Required property "name" of <x-card> must always be bound: bind it in every branch of its conditional binding, including an @else or @default one, or outside of it.`

- **Cause:** A required input bound only in some branches.
- **Fix:** Add an @else or @default branch binding it, or bind it outside the condition.

### `Property 'valuechange' does not exist on type 'HTMLElementEventMap'.`

- **Cause:** A listener for an event that is neither an output of the component nor a native event of its element: a different case, or a misspelled name.
- **Fix:** Match the name of the accessor, letter by letter.

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

- **Cause:** $event used as $event.target, or another expression reading it.
- **Fix:** Pass $event whole and read the target in the method.

### `Property 'secret' is private and only accessible within class 'XCard'.`

- **Cause:** A private or protected member read by the template.
- **Fix:** Make the member public.

### `Property 'LIMIT' does not exist on type 'XCard'.`

- **Cause:** A module constant read by the template without importing it: the expressions read the members of the class and the names the template imports.
- **Fix:** Import it in the template: @import { LIMIT } from './limits.ts'.

### `This comparison appears to be unintentional because the types '1' and '2' have no overlap.`

- **Cause:** A readonly member initialized with a literal has a literal type, and the template is checked with it.
- **Fix:** Annotate the member with a wider type.

### `Argument of type 'Set<number>' is not assignable to parameter of type 'number | readonly unknown[]'.`

- **Cause:** @for over something that is neither an array nor a number: a Set, a Map, a string.
- **Fix:** Convert it to an array, for instance in a computed signal.

### `Property '$count' does not exist on type 'XList'.`

- **Cause:** $count is not one of the variables of @for.
- **Fix:** Read the length of the list.

### `Cannot find name 'first'.`

- **Cause:** A member of the component as the value of an @case, which only accepts literals.
- **Fix:** Write the literal, or use @if.

### `'root.prices.coffee' is possibly 'undefined'.`

- **Cause:** The strict options of tsconfig.json, such as noUncheckedIndexedAccess, apply to templates too.
- **Fix:** Use ?. or ??, or a precise type.

### `[TypeChecker] "field" is read before the element it names is created: only an event handler can read a template variable declared after it`

- **Cause:** An interpolation, a binding, a condition or the iterable of a @for reading a template variable whose element comes after it in its scope.
- **Fix:** Move the element before the expression, or read the variable from an event handler, which runs once the template is rendered.

### `[TypeChecker] The track expression of a @for cannot read the template variable "field": it only reads the item of the @for and its implicit variables`

- **Cause:** A template variable read by the track expression of a @for.
- **Fix:** Track the item, a property of it, or $index.

### `Cannot redeclare block-scoped variable 'field'.`

- **Cause:** Two template variables with the same name in the same scope, or a template variable named like a variable of the enclosing @for.
- **Fix:** Rename one of them: a nested scope (a block, the row of a @for) can reuse the name.

### `[TypeChecker] "row" is not a template visible here: declare it with <template #row(…)> in this scope or in an enclosing one`

- **Cause:** A @render of a name that is not a template declared in its scope or in an enclosing one: a member, an import, a template variable, or a template declared in another branch or row. The build reports it as [Generator] too.
- **Fix:** Declare the template where the @render can see it, or pass the data as arguments to a template declared further out.

### `[TypeChecker] Template "row" is declared among HTML elements, and its content cannot be rendered among SVG elements: declare it in the namespace it is rendered in`

- **Cause:** A @render inside an <svg> (or a <math>) of a template declared among HTML elements, or the other way round: the content is created in the namespace of the declaration. The build reports it as [Generator] too.
- **Fix:** Declare the template inside the same namespace as its @render.

### `[TypeChecker] "field" is read by the template rendered by @render row before the element it names is created: render the template after the element, or read the variable from an event handler`

- **Cause:** The content of a template reads a template variable of an enclosing scope, outside of an event handler, and a @render of the template comes before the element of the variable.
- **Fix:** Move the @render after the element, or pass the value as an argument.


### `[TypeChecker] "total" is read before its @let: only an event handler can read a @let declared after it`

- **Cause:** An interpolation, a binding, a condition, the iterable of a @for, an argument of a @render or the value of a @let, its own included, reading a @let that comes after it in its scope.
- **Fix:** Move the @let before the expression, or read it from an event handler, which runs once the template is rendered.

### `[TypeChecker] "total" is read by the template rendered by @render row before its @let: render the template after the @let, or read it from an event handler`

- **Cause:** The content of a template reads a @let of an enclosing scope, outside of an event handler, and a @render of the template comes before the @let.
- **Fix:** Move the @render after the @let, or pass the value as an argument.

### `[TypeChecker] The track expression of a @for cannot read the @let "total": it only reads the item of the @for and its implicit variables`

- **Cause:** A @let read by the track expression of a @for.
- **Fix:** Track the item, a property of it, or $index.

### `Property 'toFixed' does not exist on type 'Computed<number>'.`

- **Cause:** A @let whose value reads a signal is a signal, read here without parentheses.
- **Fix:** Call it: total().toFixed(2).
### `Expected 2 arguments, but got 1.`

- **Cause:** A @render passing fewer or more arguments than the template declares parameters (reported on the @render, or on the extra arguments).
- **Fix:** Pass one argument per parameter.

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

### `The templateUrl option of XCard must be a string literal - <path>`

- **Cause:** A selector, templateUrl or styleUrl given as a constant, a template literal or a computed value, or a required option missing: the plugin reads them from the source code.
- **Fix:** Write the value as a string literal in the decorator.

### `The options of @WebComponent in XCard must be an object literal - <path>`

- **Cause:** The options of the decorator passed as a variable, or not passed at all.
- **Fix:** Write the options as an object literal in the decorator.

### `XCard must be declared in a file ending with .xd.component.ts - <path>`

- **Cause:** A class decorated with @WebComponent in a file that does not follow the component convention, so the plugin does not compile it.
- **Fix:** Move the class to a file ending with .xd.component.ts.

### `Unsupported stylesheet extension ".scss" for <path>.`

- **Cause:** A styleUrl that is not a .css file.
- **Fix:** Use plain CSS.

### `Could not find the static block applying the decorators of class "MyAppRootComponent" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.`

- **Cause:** The decorators were not compiled before the Xaendar plugin ran.
- **Fix:** Put the Babel plugin before xaendarPlugin().

### `Failed to compile component - <path>`

- **Cause:** In a build, a component that cannot be compiled: its errors are printed before this message.
- **Fix:** Fix the errors printed before it.

### `Error: Unable to resolve module path "./nope" for "Nope".`

- **Cause:** An @import whose path does not resolve: a relative path leading to no file or folder, a package that is not installed, or an alias that tsconfig.json does not declare.
- **Fix:** Fix the path, install the package, or declare the alias in the paths of tsconfig.json.

### `Module '"<path>"' has no exported member 'Callout'.`

- **Cause:** An @import naming something the module does not export.
- **Fix:** Import it by its exact exported name; the default export is imported as default as name.

### `'title' is also a member of XCard: import it under another name (… as name), or rename the member.`

- **Cause:** A name the template imports is also a member of the component, inherited ones included: an expression reading it would be ambiguous.
- **Fix:** Import it under another name: @import { title as heading } from './utils.ts'.

### `[TypeChecker] "root" is reserved in templates: import it under another name (… as name).`

- **Cause:** A symbol imported as root, $event or a name starting with __, which the compiler uses for itself.
- **Fix:** Import it under another name with as.

## Runtime

### `XCard does not seem to have a Render Function`

- **Cause:** The component did not compile, or the class is a subclass without its own @WebComponent.
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

### `Error: No element matches the required query 'input' of <x-search>`

- **Cause:** A @Query.required was read while no element of the shadow root matched it: before the render (in onInit, in an effect created there, in the template), or while the element was not in the template.
- **Fix:** Read it from afterRender on, in event handlers or in a computed signal read from them. If the element is not always there, use @Query.

### `Error: No element matches the required content query '[header]' of <x-card>`

- **Cause:** A @Query.content.required was read while no projected element matched it: before the parent projected its content, afterRender included, or while the element was not projected.
- **Fix:** Read it in event handlers. If the content is optional, or to follow it as it arrives, use @Query.content.

### `NotSupportedError: Failed to execute 'define' on 'CustomElementRegistry': the name "x-card" has already been used with this registry`

- **Cause:** Two classes defined with the same selector at runtime.
- **Fix:** Rename one of them.

### `NotSupportedError: Failed to execute 'attachShadow' on 'Element': Shadow root cannot be created on a host which already hosts a shadow tree.`

- **Cause:** attachShadow called by a component, which already has an open shadow root.
- **Fix:** Use this.shadowRoot.

### `@import rules are not allowed here.`

- **Cause:** A browser warning: a component stylesheet is a constructed stylesheet, which drops @import rules.
- **Fix:** Put every rule in the CSS file of the component.

### `ReferenceError: Template variable "field" is read before the element it names is rendered`

- **Cause:** An event handler run while the template is still being rendered, for an event a child component emits from its onInit, reading a template variable whose element is not created yet.
- **Fix:** Emit the event after the render (afterRender), or read the variable later.


### `ReferenceError: @let "total" is read before its declaration is rendered`

- **Cause:** An event handler run while the template is still being rendered, for an event a child component emits from its onInit, reading a @let the render has not reached yet.
- **Fix:** Emit the event after the render (afterRender), or read the @let later.
## Signals

### `Circular dependency detected while computing a Computed signal`

- **Cause:** A computed signal reading itself, directly or through others.
- **Fix:** Break the cycle with a writable signal.

### `Cannot set value while signals are frozen`

- **Cause:** A signal written, or read (Cannot get value…), inside watched, unwatched or Watcher.notify.
- **Fix:** Defer the work with queueMicrotask.

### `Cannot unwatch a signal that is not being watched`

- **Cause:** The disposer of an effect called when the effect is already disposed: a second time, or, for this.effect(), after the component or the directive is gone.
- **Fix:** Call it once, while the effect is alive.

## CLI

### `Tag <Widget> is not a valid custom element name. Custom element names must: …`

- **Cause:** A component name, or a project name followed by -root, that is not a valid custom element name.
- **Fix:** Use lowercase letters and a dash.

### `Tag <font-face> is a reserved tag name and cannot be used as a custom element name.`

- **Cause:** One of the names reserved by the HTML specification.
- **Fix:** Pick another name.

### `✖  Directory "user-card" already exists.`

- **Cause:** xd generate component would overwrite an existing folder.
- **Fix:** Pick another name, or add --force to replace it.

### `✖  Invalid style option: sass`

- **Cause:** xd new accepts css, scss, less and styl.
- **Fix:** Use css: it is the only extension the plugin compiles.
