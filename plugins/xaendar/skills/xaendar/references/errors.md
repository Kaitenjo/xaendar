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

- **Cause:** A listener with more than one statement, such as (click)="save(); close()".
- **Fix:** Call a single method, and do the rest in the method.

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

### `[Lexer] An element ref takes no value: write #name, which names the element it is declared on`

- **Cause:** A value given to an element ref, as in #field="name".
- **Fix:** Write #field alone: it names the element it is declared on.

### `[Lexer] An element ref names the element whatever branch is selected: declare #name among the bindings of the tag, outside of its conditional bindings`

- **Cause:** A #name inside the block of a conditional binding, or inside the parentheses of a directive (… outside of its directives).
- **Fix:** Declare the variable directly on the tag.

### `[Lexer] An element ref is just #name, without parentheses`

- **Cause:** Parentheses after the name of an element ref.
- **Fix:** Write #name alone.

### `[Lexer] @render calls a template by its name, followed by its arguments in parentheses, e.g. @render row(item())`

- **Cause:** A @render without the name of the template, without parentheses, or with a space or a dot between the name and the parentheses.
- **Fix:** Write @render name(arguments), with () when the template has no parameters.

### `[Lexer] @let declares a name and its value, ending with a semicolon, e.g. @let address = user().address;`

- **Cause:** A @let without its name or its =, or whose block closes before its ;. The same message is reported as [Parser] when the template ends before the ;, or the value is missing.
- **Fix:** Write @let name = value; with a ; ending the value.

### `[Lexer] A cast needs a type after "as", e.g. { value() as string }`

- **Cause:** An `as` closing an interpolation or an argument of a listener without the type after it: { value() as }.
- **Fix:** Write the type after as, or drop the cast.

### `[Lexer] Type arguments cannot be empty`

- **Cause:** Empty type arguments: @@exList<>(…) on a directive, <ex-picker()> on a component.
- **Fix:** Write the types, or drop the brackets.

### `[Lexer] The type arguments of a directive must be followed by its bindings between parentheses, e.g. @@selector<string>(name="value")`

- **Cause:** Something other than ( after the type arguments of a directive (@@exList<Row>x).
- **Fix:** Open the bindings right after the type arguments: @@exList<Row>(items="{rows()}").

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

- **Cause:** A construct forbidden in expressions. The same message names the others: 'new', function expressions, 'ThisKeyword', 'RegularExpressionLiteral', 'CommaToken'.
- **Fix:** Move the logic into a method or a computed signal of the class.

### `[Parser] A cast with 'as' only closes a whole interpolation or an argument of a call, e.g. { value() as string }, { format(value() as Date) } or (click)="select($event as MouseEvent)".`

- **Cause:** A cast of something that is not an argument of a call: { (item as Row).id }, { a + (b as number) }, [value as Row].
- **Fix:** Cast the whole interpolation or an argument ({ item() as Row }, { show(item() as Row) }), or type the value in the class.

### `[Parser] 'let i' is not a valid alias identifier.`

- **Cause:** An alias of @for written with let.
- **Fix:** Write the alias as index = $index.

### `[Parser] The track expression of a @for reads the item and the implicit variables as signals: call it, e.g. track item()`

- **Cause:** A track expression that is the item or an implicit variable without parentheses: the key would be the signal, a new function every time, and no row would be reused.
- **Fix:** Call the signal: track item(), or track a property of it, as in track item().id.

### `[Parser] <input> declares more than one element ref (#first, #second): an element has a single name`

- **Cause:** Two element refs on the same element.
- **Fix:** Keep one name per element.

### `[Parser] <div> cannot declare #panel: its structural directives may not render it. Declare the ref on an element inside it, whose content is a scope of its own`

- **Cause:** An element ref on an element a structural directive is applied to, directly or by a conditional binding.
- **Fix:** Declare it on an element inside, or render the element with an @if and declare the variable inside the block.

### `[Parser] '2fields' is not a valid name for an element ref: it must be an identifier.`

- **Cause:** An element ref named by something other than an identifier; 'root' is reserved in templates is reported for root, $event and the names starting with __ or $$.
- **Fix:** Use an identifier the generated code does not reserve.

### `[Parser] '2total' is not a valid name for a @let: it must be an identifier.`

- **Cause:** A @let named by something other than an identifier; 'root' is reserved in templates is reported for root, $event and the names starting with __ or $$.
- **Fix:** Use an identifier the generated code does not reserve.

### `[Parser] A <template> declares a template: name it and list its parameters, e.g. <template row(item: Item)>, then render it with @render row(item())`

- **Cause:** A <template> without name(…): a <template> is always the declaration of a template.
- **Fix:** Name it and declare its parameters, then render it with @render.

### `[Parser] A template lists its parameters in parentheses after its name, even when it has none: <template row()>`

- **Cause:** A <template row> without parentheses.
- **Fix:** Write <template row()>.

### `[Parser] A <template> declares only its name and its parameters, e.g. <template row(item: Item)>: it renders nothing where it is declared, but where a @render calls it`

- **Cause:** An attribute, an event, a conditional binding, a directive or type arguments on a <template>.
- **Fix:** Move them to the elements inside the template.

### `[Parser] The parameters of a template are declared like the ones of a function, each one with its type, e.g. <template row(item: Item, index: number)>`

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

### `[Parser] @hydrate needs a trigger: use load, idle, timer, visible, interaction, hover, never, or when followed by an expression, each one after prefetch to load the modules only`

- **Cause:** The parentheses of a @hydrate are empty, or hold an empty trigger between two commas.
- **Fix:** List at least one trigger, separated by commas: @hydrate (visible, when ready()); or leave out the parentheses to hydrate when the browser is idle: @hydrate { … }.

### `[Parser] Unknown @hydrate trigger "viewport": use load, idle, timer, visible, interaction, hover, never, or when followed by an expression, each one after prefetch to load the modules only`

- **Cause:** A trigger of a @hydrate is not one of the keywords, or an expression is written without when.
- **Fix:** Use load, idle, timer, visible, interaction, hover or never, and write when before an expression: @hydrate (when open()).

### `[Parser] The trigger "never" stands alone: any other trigger would hydrate the content`

- **Cause:** A @hydrate lists never next to another trigger.
- **Fix:** Remove never to hydrate the content, or the other triggers to leave it as the HTML of the server.

### `[Parser] The trigger "never" loads nothing: it cannot follow prefetch`

- **Cause:** prefetch never is written in a @hydrate: never loads no module.
- **Fix:** Remove it, or write after prefetch the trigger that should load the modules: @hydrate (interaction, prefetch idle).

### `[Parser] A trigger of @hydrate watches the elements of its content: it takes no element ref`

- **Cause:** A trigger of a @hydrate is written with an element ref: visible, interaction and hover of a @hydrate watch the elements of its content, which the server rendered.
- **Fix:** Remove the element ref: @hydrate (hover) { … }; use a @defer to watch another element.

### `[TypeChecker] The trigger "visible" watches the elements the server renders, and this @hydrate renders none: add an element, or a @placeholder holding one to its @client`

- **Cause:** A @hydrate with visible or interaction whose content cannot render an element: a @client without a @placeholder holding one, or only text. Those triggers watch the elements of the server, so they would never fire.
- **Fix:** Add a @placeholder holding an element to the @client, ideally with the size of the content when the trigger is visible; or use idle, load or when.

### `[Parser] The trigger "idle" is declared twice`

- **Cause:** A @hydrate lists the same trigger twice, or two when triggers.
- **Fix:** Keep one of them; join two conditions in the expression of a single when: when a() || b().

### `[Parser] @placeholder must follow the block of a @client or a @defer`

- **Cause:** A @placeholder is not right after the } of a @client or of a @defer (or of a block following the @defer): it stands alone, it follows another block or a text, or it is the second one of a @client.
- **Fix:** Write it right after the block of a @client or of a @defer, once: @client { … } @placeholder { … }.

### `[Parser] The @placeholder of a @client takes no parameters: the server renders it, and the browser replaces it at once`

- **Cause:** A @placeholder following a @client is written with parameters, which only the one of a @defer takes.
- **Fix:** Remove the parentheses: @client { … } @placeholder { … }.

### `[Parser] @defer needs a trigger: use load, idle, timer, visible, interaction, hover, or when followed by an expression, each one after prefetch to load the modules only`

- **Cause:** The parentheses of a @defer are empty, or hold an empty trigger between two commas.
- **Fix:** List at least one trigger: @defer (interaction) { … }; or leave out the parentheses to render the content when the browser is idle: @defer { … }.

### `[Parser] Unknown @defer trigger "never": use load, idle, timer, visible, interaction, hover, or when followed by an expression, each one after prefetch to load the modules only`

- **Cause:** A trigger of a @defer is not one of the keywords (never is a trigger of @hydrate only), or an expression is written without when.
- **Fix:** Use load, idle, timer, visible, interaction or hover, and write when before an expression: @defer (when open()).

### `[Parser] @defer needs a trigger after prefetch: use load, idle, timer, visible, interaction, hover, or when followed by an expression, each one after prefetch to load the modules only`

- **Cause:** prefetch is written without the trigger loading the modules after it.
- **Fix:** Write the trigger after prefetch: @defer (interaction, prefetch idle).

### `[Parser] The trigger "timer" needs a duration, such as timer(500ms)`

- **Cause:** timer is written without the time to wait between its parentheses.
- **Fix:** Write the time, in ms or s: timer(500ms), timer(2s).

### `[Parser] Expected a duration, such as 500ms or 1s, got "soon"`

- **Cause:** The time of timer, of idle, or of a parameter of a @placeholder or a @loading is not a number followed by ms or s.
- **Fix:** Write a number, with decimals or without, followed by ms or s, or alone for milliseconds: timer(1.5s), idle(500).

### `[Parser] The trigger "load" takes no arguments`

- **Cause:** A trigger taking no arguments, load or never, is written with parentheses.
- **Fix:** Remove the parentheses: @defer (load).

### `[Parser] The trigger "hover" takes at most one argument`

- **Cause:** A trigger is written with more arguments than it takes: interaction, hover, idle and timer take one, visible two, the element ref and its options.
- **Fix:** Keep one argument, the element ref of the element to watch: hover(more).

### `[Parser] Expected the element ref naming the element to watch, got "a.b"`

- **Cause:** The argument of visible, interaction or hover is not a name: they watch the element an element ref names.
- **Fix:** Give the element an element ref, and write its name: <button #more>…</button> @defer (hover(more)) { … }.

### `[Parser] Expected the options of the observer as an object literal, such as { rootMargin: '200px' }, got "margin"`

- **Cause:** The options of visible, after the element ref or alone, are not written as an object literal.
- **Fix:** Write the options between braces, reading the members of the component inside them if needed: visible(frame, { rootMargin: margin() }).

### `[Parser] Unknown parameter "after 1s" of @placeholder: use minimum followed by a duration, such as minimum 500ms`

- **Cause:** A parameter of a @placeholder or of a @loading is not one it takes: a @placeholder takes minimum, a @loading after and minimum.
- **Fix:** Use the parameters of the block, each one followed by a time: @placeholder (minimum 500ms), @loading (after 100ms, minimum 1s).

### `[Parser] The parameter "minimum" of @loading is declared twice`

- **Cause:** A parameter of a @placeholder or of a @loading is written twice.
- **Fix:** Keep one of them.

### `[Parser] @loading is declared twice for this @defer`

- **Cause:** A @placeholder, a @loading or an @error written twice after the same @defer.
- **Fix:** Keep one of them: each block follows a @defer once, in any order.

### `[Parser] @loading must follow the block of a @defer`

- **Cause:** A @loading or an @error (`@error must follow the block of a @defer`) not right after a @defer or one of the blocks following it.
- **Fix:** Write it right after the @defer: @defer (idle) { … } @loading { … } @error (error) { … }.

### `[TypeChecker] The trigger "visible" watches the elements of the @placeholder, and this @defer renders none before its trigger: add a @placeholder holding an element, or name the element to watch with an element ref, such as hover(button)`

- **Cause:** A @defer with visible, interaction or hover without a @placeholder, or with one rendering no element (only text): those triggers watch the elements of the @placeholder, so they would never fire.
- **Fix:** Add a @placeholder holding an element, ideally with the size of the content when the trigger is visible; name the element to watch, as in hover(button); or use idle, load, timer or when.

### `'error' is reserved in templates: give the error of @error another name.`

- **Cause:** The name of the error of an @error, between its parentheses, is not an identifier, or is reserved (`$event`, names starting with `__` or `$$`).
- **Fix:** Give it another identifier: @error (failure) { … }.

### `[Parser] @try needs a @catch: write @catch (error) { … } right after its block`

- **Cause:** A @try block not followed by its @catch, as JavaScript requires.
- **Fix:** Write @catch (error) { … } right after the } of the @try, or remove the @try.

### `[Parser] @catch must follow the block of a @try`

- **Cause:** A @catch not right after the } of a @try: alone, after another block or a text, or the second one of a @try.
- **Fix:** Write it right after the block of a @try, once: @try { … } @catch (error) { … }.

### `[Parser] (click) never runs: the server renders a @placeholder, and the browser replaces it without running its code`

- **Cause:** An element of a @placeholder declares a listener. The server binds no listener, and the browser removes the placeholder without running its code.
- **Fix:** Move the listener to the content of the @client, which the browser renders.

### `'document' exists only in the browser: on the server it is undefined. Read it in a @client block, or check it with typeof.`

- **Cause:** A warning of a project rendering on the server: an expression the server renders reads a global only the browser has.
- **Fix:** Move the expression to a @client block, or check the name with typeof in the same expression: typeof document !== 'undefined' && document.title.

### `[TypeChecker] @client is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the block`

- **Cause:** A @client or a @hydrate in a project without ssr in xaendar.json: they only mean something for a page rendered on the server.
- **Fix:** Remove the block, keeping its content, or declare ssr in xaendar.json.

### `The ssr option of XCard is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the option - <path>`

- **Cause:** The ssr option of @WebComponent in a project without ssr in xaendar.json: it only means something for a page rendered on the server.
- **Fix:** Remove the option, or declare ssr in xaendar.json.

### `[Parser] A type argument cannot be empty`

- **Cause:** An empty type argument between two commas: <Row,, number>.
- **Fix:** Remove the extra comma, or write the type.

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

### `[TypeChecker] Required property "name" of <x-card> must always be bound: bind it in every branch of its conditional binding, including an @else or @default one, or outside of it.`

- **Cause:** A required input bound only in some branches.
- **Fix:** Add an @else or @default branch binding it, or bind it outside the condition.

### `Property 'valuechange' does not exist on type 'HTMLElementEventMap'.`

- **Cause:** A listener for an event that is neither an output of the component nor a native event of its element: a different case, or a misspelled name.
- **Fix:** Match the name of the accessor, letter by letter.

### `[TypeChecker] Unknown property "shade" on @@exTint (TintDirective has no @Property with this name).`

- **Cause:** An input the directive does not declare.
- **Fix:** Use the name of a @Property of the directive.

### `[TypeChecker] "showValue" is the property of an input of XCard declaring the alias "show-value": bind it as show-value="…".`

- **Cause:** A template binding an input by the name of its property, while the input declares an alias: the name of the property would be an attribute of the element, which the input never reads.
- **Fix:** Bind the input by its alias.

### `Property 'bubbly' does not exist on type 'HTMLElementEventMap'.`

- **Cause:** A listener for an unknown event on a native element.
- **Fix:** Listen to custom events on the component emitting them, or on a component re-emitting them.

### `Type 'string' does not satisfy the expected type 'number'.`

- **Cause:** A static value, always a string, bound to an input of another type.
- **Fix:** Bind an expression: count="{ 3 }".

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

### `Module '"<path>"' has no exported member 'Callout'.`

- **Cause:** An @import naming something the module does not export.
- **Fix:** Import it by its exact exported name; the default export is imported as default as name.

### `'title' is also a member of XCard: import it under another name (… as name), or rename the member.`

- **Cause:** A name the template imports is also a member of the component, inherited ones included: an expression reading it would be ambiguous.
- **Fix:** Import it under another name: @import { title as heading } from './utils.ts'.

### `[TypeChecker] "root" is reserved in templates: import it under another name (… as name).`

- **Cause:** A symbol imported as root, $event or a name starting with __, which the compiler uses for itself.
- **Fix:** Import it under another name with as.

### `[TypeChecker] "field" is read before the element it names is created: only an event handler can read an element ref declared after it`

- **Cause:** An interpolation, a binding, a condition, the iterable of a @for or an argument of a @render reading an element ref whose element comes after it in its scope.
- **Fix:** Move the element before the expression, or read the variable from an event handler, which runs once the template is rendered.

### `[TypeChecker] The track expression of a @for cannot read the element ref "field": it only reads the item of the @for and its implicit variables`

- **Cause:** An element ref read by the track expression of a @for.
- **Fix:** Track the item, a property of it, or $index.

### `Cannot redeclare block-scoped variable 'field'.`

- **Cause:** Two element refs or templates with the same name in the same scope, or one named like a variable of the enclosing @for.
- **Fix:** Rename one of them: a nested scope (a block, the row of a @for) can reuse the name.

### `[TypeChecker] "row" is not a template visible here: declare it with <template row(…)> in this scope or in an enclosing one`

- **Cause:** A @render of a name that is not a template declared in its scope or in an enclosing one: a member, an import, an element ref, or a template declared in another branch or row. The build reports it as [Generator] too.
- **Fix:** Declare the template where the @render can see it, or pass the data as arguments to a template declared further out.

### `[TypeChecker] Template "row" is declared among HTML elements, and its content cannot be rendered among SVG elements: declare it in the namespace it is rendered in`

- **Cause:** A @render inside an <svg> (or a <math>) of a template declared among HTML elements, or the other way round: the content is created in the namespace of the declaration. The build reports it as [Generator] too.
- **Fix:** Declare the template in the namespace of its @render.

### `[TypeChecker] "field" is read by the template rendered by @render row before the element it names is created: render the template after the element, or read the ref from an event handler`

- **Cause:** The content of a template reads an element ref of an enclosing scope, outside of an event handler, and a @render of the template comes before the element of the ref.
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

- **Cause:** A @render passing fewer or more arguments than the template declares parameters: reported on the @render, or on the extra arguments.
- **Fix:** Pass one argument per parameter.

### `[TypeChecker] Property "name" needs a value: write name="…" or name="{ expression }". An attribute without a value is only valid on a native element.`

- **Cause:** An input of a component or a directive written like a boolean attribute: <x-card name>.
- **Fix:** Give it a value: name="text" or name="{expression}". The form without a value is only for the attributes of native elements (<input disabled />).

### `[TypeChecker] @@exList declares type arguments, but ListDirective is not generic.`

- **Cause:** Type arguments (@@exList<Row>(…), <ex-list(Row)>) on a directive or a component whose class has no type parameters.
- **Fix:** Remove them, or add the type parameters to the class.

### `[TypeChecker] @@exList declares 3 type arguments, but ListDirective has 2 type parameters (Item, Key).`

- **Cause:** More type arguments than the class has type parameters.
- **Fix:** Pass at most one argument per type parameter, in their order.

### `[TypeChecker] <div> declares type arguments, but only a WebComponent imported in the template can declare them.`

- **Cause:** Type arguments after the name of a native element or of a custom element of another library: <div(Row)>.
- **Fix:** Remove them: only the tags of imported generic components take type arguments.

## Build

### `Invalid custom element name "laberr" in component XCard - <path>`

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

### `Could not find style at <path>`

- **Cause:** A styleUrl pointing to a missing file.
- **Fix:** Fix the path, relative to the file of the component.

### `The templateUrl option of XCard must be a string literal - <path>`

- **Cause:** A selector, templateUrl or styleUrl given as a constant, a template literal or a computed value, or a required option missing: the plugin reads them from the source code.
- **Fix:** Write the value as a string literal in the decorator.

### `The ssr option of XCard must be an object literal - <path>`

- **Cause:** The ssr option given as a variable: the plugin has to read it from the source code, to know whether the component renders only in the browser.
- **Fix:** Write ssr as an object literal in the decorator.

### `The ssr.render option of XCard must be the literal false - <path>`

- **Cause:** ssr.render given as true, as a variable or as a shorthand property.
- **Fix:** Write render: false, or remove the option.

### `The ssr.hydrate option of XCard must be a string literal next to ssr.render - <path>`

- **Cause:** A hydrate next to render: false given as a variable: the server writes it without the class of the component.
- **Fix:** Write the trigger as a string literal.

### `The options of @WebComponent in XCard must be an object literal - <path>`

- **Cause:** The options of the decorator passed as a variable, or not passed at all.
- **Fix:** Write the options as an object literal in the decorator.

### `XCard must be declared in a file ending with .xd.component.ts - <path>`

- **Cause:** A class decorated with @WebComponent in a file that does not follow the component convention, so the plugin does not compile it.
- **Fix:** Move the class to a file ending with .xd.component.ts.

### `Unsupported stylesheet extension ".styl" for <path>.`

- **Cause:** A styleUrl that is not a .css, .scss, .sass or .less file, such as a Stylus stylesheet.
- **Fix:** Use CSS, Sass or Less.

### `The "sass" package is required to compile <path>: install it with "npm i -D sass".`

- **Cause:** A .scss or .sass stylesheet in a project that does not have the sass package; the same holds for a .less stylesheet without the less package. They are optional peer dependencies of @xaendar/build-tools.
- **Fix:** Install the package named in the message, with npm i -D sass or npm i -D less.

### `Failed to compile style - <path>`

- **Cause:** A stylesheet the plugin could not compile: the next line gives the reason, such as an error of Sass or Less, a missing package or an unsupported extension.
- **Fix:** Fix what the next line reports, in the stylesheet at the given path or in a file it imports.

### `Could not find the static block applying the decorators of class "MyAppRootComponent" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.`

- **Cause:** The decorators were not compiled before the Xaendar plugin ran.
- **Fix:** Put the Babel plugin before xaendarPlugin().

### `Failed to compile component - <path>`

- **Cause:** In a build, a component that cannot be compiled: its errors are printed before this message.
- **Fix:** Fix the errors printed before it.

### `Error: Unable to resolve module path "./nope" for "Nope".`

- **Cause:** An @import whose path does not resolve: a relative path leading to no file or folder, a package that is not installed, or an alias that tsconfig.json does not declare.
- **Fix:** Fix the path, install the package, or declare the alias in the paths of tsconfig.json.

### `Error: <path> does not export render(url): export the function rendering a page on the server`

- **Cause:** The dev server rendering a page with an entry of the server that does not export render: the export removed or renamed.
- **Fix:** Export from the entry the function render(url), which returns the HTML of the page of a URL.

### `Error: <path>/other/card.xd.component.ts declares a component or a directive outside of <path>/src, the folder of the entry of @acme/ui.`

- **Cause:** xd build of a library whose program holds a component or a directive outside the folder of its entry: the package keeps the paths of the modules relative to that folder.
- **Fix:** Move the file under the folder of the entry (src/ by default).

### `Error: The selector "ui-card" of TileComponent is declared twice in @acme/ui.`

- **Cause:** xd build of a library with two components, or two directives, with the same selector.
- **Fix:** Rename one of them.

### `Error: card/card.xd.component#CardComponent: the type of one of its bindings reads Size from <path>/src/card/size, which a module of the library must export for the applications to read it.`

- **Cause:** xd build of a library with an input or an event whose type uses a name its module does not export (a type alias declared without export), or a file outside the library: the applications read the types from the declarations of the package.
- **Fix:** Export the type from its module.

## Runtime

### `XCard does not seem to have a Render Function`

- **Cause:** The component did not compile, or the class is a subclass without its own @WebComponent.
- **Fix:** Look for the compiler message printed before it.

### `ReferenceError: Signal is not defined`

- **Cause:** loadSignals() did not run before @xaendar/core was loaded.
- **Fix:** Call it in a module loaded before the application.

### `Error: No directive registered for selector "exTint"`

- **Cause:** The template imports the directive, but its module was never loaded at runtime.
- **Fix:** Import the module in the template with @import (not @import lazy), or load it before the template is rendered.

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

### `Error: @HostProperty('class.') names no class`

- **Cause:** A @HostProperty with class. and no class after it. Thrown when the class is defined, as soon as its module is imported; an empty name throws @HostProperty('') names no attribute.
- **Fix:** Name the attribute, or the class after class.: @HostProperty('class.on').

### `Error: @HostEvent() names no event`

- **Cause:** A @HostEvent with an empty name. Thrown when the class is defined.
- **Fix:** Name the event: @HostEvent('click').

### `Error: @HostProperty('role') cannot decorate the static member defaultRole`

- **Cause:** A @HostProperty on a static field, getter or accessor: the host element belongs to an instance.
- **Fix:** Decorate an instance member, which may read the static one.

### `Error: @HostEvent('click') cannot decorate the static method handle`

- **Cause:** A @HostEvent on a static method: the host element belongs to an instance.
- **Fix:** Decorate an instance method.

### `NotSupportedError: Failed to execute 'define' on 'CustomElementRegistry': the name "x-card" has already been used with this registry`

- **Cause:** Two classes defined with the same selector at runtime.
- **Fix:** Rename one of them.

### `NotSupportedError: Failed to execute 'attachShadow' on 'Element': Shadow root cannot be created on a host which already hosts a shadow tree.`

- **Cause:** attachShadow called by a component, which already has an open shadow root.
- **Fix:** Use this.shadowRoot.

### `@import rules are not allowed here.`

- **Cause:** A browser warning: a component stylesheet is a constructed stylesheet, which drops the @import rules of a .css file.
- **Fix:** Put every rule in the CSS file of the component, or use Sass or Less, whose imports are resolved at build time.

### `ReferenceError: Element ref "field" is read before the element it names is rendered`

- **Cause:** An event handler run while the template is still being rendered, for an event a child component emits from its onInit, reading an element ref whose element is not created yet.
- **Fix:** Emit the event after the render (afterRender), or read the variable later.

### `ReferenceError: @let "total" is read before its declaration is rendered`

- **Cause:** An event handler run while the template is still being rendered, for an event a child component emits from its onInit, reading a @let the render has not reached yet.
- **Fix:** Emit the event after the render (afterRender), or read the @let later.

### `Error: ToastComponent does not seem to be decorated with @WebComponent`

- **Cause:** createComponent, or @Query(Class), given a class that is not decorated with @WebComponent itself: a base class, or a subclass of a component without its own decorator.
- **Fix:** Pass the decorated class, or decorate the subclass with its own @WebComponent.

### `Error: Property "level" is bound by more than one group`

- **Cause:** createComponent with the same input in two groups of properties: the first group to stop holding would reset it while the other still binds it.
- **Fix:** Bind it in one group, with a getter choosing the value: { level: () => this.urgent() ? 'urgent' : 'info' }.

### `Error: Directive ParityDirective is not a CustomDirective`

- **Cause:** A structural directive in the directives of createComponent: there is no template to render or not.
- **Fix:** Pass custom directives only; decide whether to create the component in code.

### `Error: Directive TipDirective is applied more than once on <x-card>: it is already a host directive of the component`

- **Cause:** A template (@@tip) or createComponent applying a directive the component already declares in hostDirectives.
- **Fix:** Bind the inputs the component exposes for its host directive instead of applying the directive again.

### `Error: XCard declares the host directive TipDirective more than once`

- **Cause:** The same directive listed twice in hostDirectives. Thrown when the element is created.
- **Fix:** List it once.

### `Error: TipDirective does not declare an input named "text"`

- **Cause:** A name in the properties of a host directive that is not one of its @Property accessors; does not declare an event named "…" is the same for events.
- **Fix:** Use the name of the accessor of the directive; rename it with { name, alias }.

### `Error: XCard already has an input named "hint", which TipDirective cannot expose`

- **Cause:** An exposed input of a host directive named like an input of the component or of another host directive.
- **Fix:** Expose it under another name: { name: 'text', alias: 'tipText' }.

### `Error: Invalid symbol for InputSignal set method`

- **Cause:** set called on an InputSignal through a cast: inputs are written only by the bindings of the parent.
- **Fix:** For a value the component changes too, copy the input into a local signal in an effect, and write the local one.

### `ReferenceError: HTMLElement is not defined`

- **Cause:** On the server, a module of @xaendar/core or of a component evaluated before loadServerDom(): imported statically by the entry, or before the call.
- **Fix:** Call loadSignals() and loadServerDom() first in the entry of the server, and import @xaendar/ssr and the components afterwards, with import().

### `ReferenceError: document is not defined`

- **Cause:** On the server, the constructor, a field initializer or onInit of a component reading document (or window), or a module reading it when evaluated: the server DOM has no document.
- **Fix:** Check typeof document first, or move the code to an effect or to afterRender, which only run in the browser.

### `Error: ProductPageComponent is not defined: decorate it with @WebComponent, and install the server DOM with loadServerDom() before importing its module`

- **Cause:** renderToString() received a class the server does not define as a custom element: a class without @WebComponent.
- **Fix:** Decorate the class with @WebComponent.

### `Error: ProductPageComponent has no template compiled for the server: build its module with the Vite plugin of @xaendar/build-tools in the server environment`

- **Cause:** The module of the component was built without the server rendering of the Vite plugin, so it registered no template for the server: the plugin without its ssr option, Vite without the plugin, or a spec run by xd test, which compiles the templates for the browser.
- **Fix:** Declare ssr in xaendar.json, or pass ssr to xaendarPlugin(). Check the server rendering with xd start or xd prerender, not in a spec.

### `Error: dist/server/entry-server.js does not export render(url): export the function rendering a page on the server from src/entry-server.ts`

- **Cause:** npm run serve with a build whose entry of the server does not export render: the export removed or renamed, and the project built without running xd start or xd prerender, which report it.
- **Fix:** Export from src/entry-server.ts the function render(url), which returns the HTML of the page of a URL, then build the project again.

### `Error: inputs.product.onSave is a function, which cannot be written into the HTML: pass the data it is built from, and build it in the component`

- **Cause:** renderToString() received an input, or a value of the transfer state, that is a function or a symbol: the HTML carries data only.
- **Fix:** Pass the data the function is built from, and build it in the component, which runs on the server and in the browser.

### `Error: inputs.price is an instance of Money, which cannot be written into the HTML: pass a plain object, an array, a Date, a Map or a Set`

- **Cause:** renderToString() received an input, or a value of the transfer state, that is an instance of a class other than Date, Map and Set: the browser could not build it again from the HTML.
- **Fix:** Pass its data as a plain object, and build the instance in the component.

### `Error: inputs.category contains itself, which cannot be written into the HTML`

- **Cause:** renderToString() received an input, or a value of the transfer state, holding an object that contains itself, such as a tree whose nodes point to their parent.
- **Fix:** Pass the data without the cycle, such as the ids of the parents, and link the objects again in the component.

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

### `✖  Invalid style option: styl. Use one of css, scss, sass, less.`

- **Cause:** A --style option of xd new that is not one of the formats the plugin compiles.
- **Fix:** Pass css, scss, sass or less, or leave --style out to choose the format from a list.

### `✖  Invalid style "styl" in <path>: use one of css, scss, sass, less.`

- **Cause:** xd generate component found, in the nearest xaendar.json, a generate.components.style that is not one of the formats the plugin compiles.
- **Fix:** Set it to css, scss, sass or less, or remove it to get CSS.

### `✖  The project does not render on the server: declare "ssr": { "entry": "src/entry-server" } in its xaendar.json.`

- **Cause:** xd prerender in a project whose xaendar.json declares no ssr.
- **Fix:** Declare the entry of the server in the ssr of xaendar.json, as xd new --ssr does.

### `✖  Invalid ssr entry "src/entry-server.ts" in xaendar.json: write it without extension.`

- **Cause:** xd start, xd build, xd test or xd prerender in a project whose xaendar.json writes the entry of ssr with the extension of its file.
- **Fix:** Remove the extension: "entry": "src/entry-server".

### `✖  src/entry-server does not export render(url): export the function rendering a page on the server.`

- **Cause:** xd prerender with an entry of the server that does not export render: the export removed or renamed.
- **Fix:** Export from the entry the function render(url), which returns the HTML of the page of a URL.

### `✖  Invalid library name "Acme UI": use the name of an npm package, lowercase, with an optional scope (@acme/ui).`

- **Cause:** xd generate library or xd add library with a name that is not the one of an npm package.
- **Fix:** Pass a lowercase name, with an optional scope: @acme/ui creates the folder ui.

### `✖  <path>/xaendar.json declares a workspace already: add the library to it with xd add library ui.`

- **Cause:** xd generate library run inside a workspace, which it would nest in it.
- **Fix:** Run xd add library inside the workspace, or xd generate library outside of it.

### `✖  No xaendar.json found: run xd add library inside a project, or create a workspace with xd generate library.`

- **Cause:** xd add library outside of any project.
- **Fix:** Run it inside the project or the workspace, or create one with xd generate library.

### `✖  The workspace has a library "@acme/ui" already, or a folder <path>.`

- **Cause:** xd add library with the name of a library of the libs, or of a folder already in libraries/.
- **Fix:** Pick another name.

### `✖  Cannot add the paths of "@acme/ui" to <path>/tsconfig.json, which cannot be read as plain JSON: add them to its compilerOptions.paths by hand, then run the command again.`

- **Cause:** xd add library with a tsconfig.json holding comments or trailing commas: the command writes nothing.
- **Fix:** Add the paths printed after the message to compilerOptions.paths, then run the command again.

### `✖  No workspace holds <path>: create one with xd generate library @acme/ui.`

- **Cause:** xd generate component --library outside of any project.
- **Fix:** Run it inside the workspace, or leave --library out.

### `✖  No library "ui" in the libs of <path>/xaendar.json.`

- **Cause:** xd generate component --library or xd build with a name that is neither the name of the package nor the folder of a library of the libs.
- **Fix:** Use the key of the library in libs (@acme/ui) or the name of its folder (ui).

### `✖  No workspace holds <path>: xd build ui builds a library of a workspace.`

- **Cause:** xd build with the name of a library, outside of a workspace.
- **Fix:** Run it inside the workspace, or run xd build alone to build the project.

### `✖  charts depends on @acme/ui, another library of the workspace: building a library against another one is not supported yet.`

- **Cause:** xd build of a library listing another library of the workspace in its dependencies or peerDependencies.
- **Fix:** Not supported yet: build the other libraries by name (xd build ui), or move what the two share into one library.
