import type { Messages } from '../../../core/i18n/i18n';

/**
 * Where an error comes from.
 */
export type ErrorPhase = 'Lexer' | 'Parser' | 'TypeChecker' | 'Generator' | 'Build' | 'Runtime' | 'Signals' | 'CLI';

/**
 * A message produced by the compiler, the build, the runtime or the CLI.
 */
export type ErrorEntry = {
  /**
   * Where the message comes from.
   */
  readonly phase: ErrorPhase;
  /**
   * The message, as printed; positions and paths are left out. It is also the key of the texts
   * explaining it (cause and fix) in the `errors` texts.
   */
  readonly message: keyof Messages['errors'];
  /**
   * The path of the page discussing it.
   */
  readonly page: string;
};

/**
 * The messages documented in the site, each observed while writing it.
 */
export const ERRORS: readonly ErrorEntry[] = [
  {
    phase: 'Lexer',
    message: '[Lexer] Unknown flow-control keyword',
    page: 'templates/overview'
  },
  {
    phase: 'Lexer',
    message: "[Lexer] Comment never closed: '<!--' without '-->'",
    page: 'templates/overview'
  },
  {
    phase: 'Lexer',
    message: "[Lexer] Unexpected character 'p' after '/': expected '>' to close self-closing tag",
    page: 'templates/overview'
  },
  {
    phase: 'Lexer',
    message: "[Lexer] Attribute value must start with double quotes '\"'",
    page: 'templates/overview'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Event must be included in Double Quotes',
    page: 'templates/events'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Event handler cannot be empty',
    page: 'templates/events'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] No spaces are allowed in event handler name',
    page: 'templates/events'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Expected { after @import',
    page: 'templates/imports'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Directives cannot be declared inside another directive',
    page: 'directives/conditional'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] The properties of a structural directive cannot be bound conditionally',
    page: 'directives/structural'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Structural directives cannot listen to events: they hold no element to dispatch them on',
    page: 'directives/structural'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] An element ref takes no value: write #name, which names the element it is declared on',
    page: 'templates/element-refs'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] An element ref names the element whatever branch is selected: declare #name among the bindings of the tag, outside of its conditional bindings',
    page: 'templates/element-refs'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] An element ref is just #name, without parentheses',
    page: 'templates/element-refs'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] @render calls a template by its name, followed by its arguments in parentheses, e.g. @render row(item())',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] @let declares a name and its value, ending with a semicolon, e.g. @let address = user().address;',
    page: 'templates/let'
  },
  {
    phase: 'Parser',
    message: '[Parser] Expected closing tag input while file is over',
    page: 'templates/overview'
  },
  {
    phase: 'Parser',
    message: '[Parser] Expected closing tag div, found DIV',
    page: 'templates/overview'
  },
  {
    phase: 'Parser',
    message: '[Parser] No transition function for token of type ELSE',
    page: 'templates/if'
  },
  {
    phase: 'Parser',
    message: '[Parser] Attribute "title" is bound more than once on <p>',
    page: 'templates/conditional-bindings'
  },
  {
    phase: 'Parser',
    message: '[Parser] Class "on" is bound more than once on <p>',
    page: 'templates/binding'
  },
  {
    phase: 'Parser',
    message: '[Parser] [class.on] toggles the class by the value of an expression: [class.on]="{expression}"',
    page: 'templates/binding'
  },
  {
    phase: 'Parser',
    message: '[Parser] "[style.color]" is not a binding: a class is toggled with [class.name]="{expression}"',
    page: 'templates/binding'
  },
  {
    phase: 'Parser',
    message: '[Parser] [class.on] cannot be bound inside a directive: bind it on the element',
    page: 'templates/binding'
  },
  {
    phase: 'Parser',
    message: '[Parser] Directive "exTint" is applied more than once on <p>',
    page: 'directives/custom'
  },
  {
    phase: 'Parser',
    message: "[Parser] 'user(); as u' must be a single expression, got '; as u' after 'user()'.",
    page: 'templates/expressions'
  },
  {
    phase: 'Parser',
    message: "[Parser] 'FirstAssignment' is not allowed inside template expressions.",
    page: 'templates/expressions'
  },
  {
    phase: 'Parser',
    message: "[Parser] 'let i' is not a valid alias identifier.",
    page: 'templates/for'
  },
  {
    phase: 'Parser',
    message: '[Parser] The track expression of a @for reads the item and the implicit variables as signals: call it, e.g. track item()',
    page: 'templates/for'
  },
  {
    phase: 'Parser',
    message: '[Parser] <input> declares more than one element ref (#first, #second): an element has a single name',
    page: 'templates/element-refs'
  },
  {
    phase: 'Parser',
    message: '[Parser] <div> cannot declare #panel: its structural directives may not render it. Declare the ref on an element inside it, whose content is a scope of its own',
    page: 'templates/element-refs'
  },
  {
    phase: 'Parser',
    message: "[Parser] '2fields' is not a valid name for an element ref: it must be an identifier.",
    page: 'templates/element-refs'
  },
  {
    phase: 'Parser',
    message: "[Parser] '2total' is not a valid name for a @let: it must be an identifier.",
    page: 'templates/let'
  },
  {
    phase: 'Parser',
    message: '[Parser] A <template> declares a template: name it and list its parameters, e.g. <template row(item: Item)>, then render it with @render row(item())',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] A template lists its parameters in parentheses after its name, even when it has none: <template row()>',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] A <template> declares only its name and its parameters, e.g. <template row(item: Item)>: it renders nothing where it is declared, but where a @render calls it',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] The parameters of a template are declared like the ones of a function, each one with its type, e.g. <template row(item: Item, index: number)>',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] The parameter \'item\' of template "row" needs a type or a default value, e.g. item: string or item = \'\'',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] The parameter \'index: number\' of template "row" must be optional or have a default value, as \'dense = false\' before it: a @render leaves out only the last arguments',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] Template "row" declares the parameter "item" more than once',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: "[Parser] '2row' cannot name a template: it must be an identifier",
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] @render passes each argument to its parameter: spread the values in separate arguments, e.g. @render row(pair()[0], pair()[1])',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] @hydrate needs a trigger: use load, idle, timer, visible, interaction, hover, never, or when followed by an expression, each one after prefetch to load the modules only',
    page: 'tools/ssr/progressive-hydration'
  },
  {
    phase: 'Parser',
    message: '[Parser] Unknown @hydrate trigger "viewport": use load, idle, timer, visible, interaction, hover, never, or when followed by an expression, each one after prefetch to load the modules only',
    page: 'tools/ssr/progressive-hydration'
  },
  {
    phase: 'Parser',
    message: '[Parser] The trigger "idle" is declared twice',
    page: 'tools/ssr/progressive-hydration'
  },
  {
    phase: 'Parser',
    message: '[Parser] The trigger "never" stands alone: any other trigger would hydrate the content',
    page: 'tools/ssr/progressive-hydration'
  },
  {
    phase: 'Parser',
    message: '[Parser] The trigger "never" loads nothing: it cannot follow prefetch',
    page: 'tools/ssr/progressive-hydration'
  },
  {
    phase: 'Parser',
    message: '[Parser] A trigger of @hydrate watches the elements of its content: it takes no element ref',
    page: 'tools/ssr/progressive-hydration'
  },
  {
    phase: 'Parser',
    message: '[Parser] @placeholder must follow the block of a @client or a @defer',
    page: 'tools/ssr/client-only'
  },
  {
    phase: 'Parser',
    message: '[Parser] The @placeholder of a @client takes no parameters: the server renders it, and the browser replaces it at once',
    page: 'tools/ssr/client-only'
  },
  {
    phase: 'Parser',
    message: '[Parser] @defer needs a trigger: use load, idle, timer, visible, interaction, hover, or when followed by an expression, each one after prefetch to load the modules only',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] Unknown @defer trigger "never": use load, idle, timer, visible, interaction, hover, or when followed by an expression, each one after prefetch to load the modules only',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] @defer needs a trigger after prefetch: use load, idle, timer, visible, interaction, hover, or when followed by an expression, each one after prefetch to load the modules only',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] The trigger "timer" needs a duration, such as timer(500ms)',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] Expected a duration, such as 500ms or 1s, got "soon"',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] The trigger "load" takes no arguments',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] The trigger "hover" takes at most one argument',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] Expected the element ref naming the element to watch, got "a.b"',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] Expected the options of the observer as an object literal, such as { rootMargin: \'200px\' }, got "margin"',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] Unknown parameter "after 1s" of @placeholder: use minimum followed by a duration, such as minimum 500ms',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] The parameter "minimum" of @loading is declared twice',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] @loading is declared twice for this @defer',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] @loading must follow the block of a @defer',
    page: 'templates/defer'
  },
  {
    phase: 'Parser',
    message: '[Parser] @try needs a @catch: write @catch (error) { … } right after its block',
    page: 'templates/try'
  },
  {
    phase: 'Parser',
    message: '[Parser] @catch must follow the block of a @try',
    page: 'templates/try'
  },
  {
    phase: 'Parser',
    message: '[Parser] (click) never runs: the server renders a @placeholder, and the browser replaces it without running its code',
    page: 'tools/ssr/client-only'
  },
  {
    phase: 'Build',
    message: '\'document\' exists only in the browser: on the server it is undefined. Read it in a @client block, or check it with typeof.',
    page: 'tools/ssr/client-only'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] foreign-thing selector is not associated to any WebComponent imported in the template, nor declared in customElements',
    page: 'templates/imports'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] sl-button is both imported as a WebComponent and declared in customElements',
    page: 'components/registration'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] @@exTint selector is not associated to any Directive imported in the template',
    page: 'directives/overview'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] x-card is missing the following required properties: ● name',
    page: 'components/inputs'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] Required property "name" of <x-card> must always be bound: bind it in every branch of its conditional binding, including an @else or @default one, or outside of it.',
    page: 'templates/conditional-bindings'
  },
  {
    phase: 'TypeChecker',
    message: "Property 'valuechange' does not exist on type 'HTMLElementEventMap'.",
    page: 'components/outputs'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] Unknown property "shade" on @@exTint (TintDirective has no @Property with this name).',
    page: 'directives/custom'
  },
  {
    phase: 'TypeChecker',
    message: "Property 'bubbly' does not exist on type 'HTMLElementEventMap'.",
    page: 'components/outputs'
  },
  {
    phase: 'TypeChecker',
    message: "Type 'string' does not satisfy the expected type 'number'.",
    page: 'components/inputs'
  },
  {
    phase: 'TypeChecker',
    message: "Property 'secret' is private and only accessible within class 'XCard'.",
    page: 'templates/expressions'
  },
  {
    phase: 'TypeChecker',
    message: "Property 'LIMIT' does not exist on type 'XCard'.",
    page: 'templates/expressions'
  },
  {
    phase: 'TypeChecker',
    message: "This comparison appears to be unintentional because the types '1' and '2' have no overlap.",
    page: 'templates/expressions'
  },
  {
    phase: 'TypeChecker',
    message: "Argument of type 'Set<number>' is not assignable to parameter of type 'number | readonly unknown[]'.",
    page: 'templates/for'
  },
  {
    phase: 'TypeChecker',
    message: "Property '$count' does not exist on type 'XList'.",
    page: 'templates/for'
  },
  {
    phase: 'TypeChecker',
    message: "Cannot find name 'first'.",
    page: 'templates/switch'
  },
  {
    phase: 'TypeChecker',
    message: "'root.prices.coffee' is possibly 'undefined'.",
    page: 'templates/expressions'
  },
  {
    phase: 'Build',
    message: 'Invalid custom element name "laberr" in component XCard - <path>',
    page: 'components/registration'
  },
  {
    phase: 'Build',
    message: 'Selector "x-card" of component "A" - <path> is already used by component "B" - <path>. Custom element names must be unique.',
    page: 'components/registration'
  },
  {
    phase: 'Build',
    message: 'Selector "exTint" of directive "A" - <path> is already used by directive "B" - <path>. Directive selectors must be unique.',
    page: 'directives/overview'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] The trigger "visible" watches the elements the server renders, and this @hydrate renders none: add an element, or a @placeholder holding one to its @client',
    page: 'tools/ssr/progressive-hydration'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] The trigger "visible" watches the elements of the @placeholder, and this @defer renders none before its trigger: add a @placeholder holding an element, or name the element to watch with an element ref, such as hover(button)',
    page: 'templates/defer'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] @client is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the block',
    page: 'tools/ssr/client-only'
  },
  {
    phase: 'Build',
    message: 'The ssr option of XCard is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the option - <path>',
    page: 'tools/ssr/client-only'
  },
  {
    phase: 'Build',
    message: 'Could not find template at <path>',
    page: 'components/registration'
  },
  {
    phase: 'Build',
    message: 'Could not find style at <path>',
    page: 'components/styling'
  },
  {
    phase: 'Build',
    message: 'The templateUrl option of XCard must be a string literal - <path>',
    page: 'components/anatomy'
  },
  {
    phase: 'Build',
    message: 'The options of @WebComponent in XCard must be an object literal - <path>',
    page: 'components/anatomy'
  },
  {
    phase: 'Build',
    message: 'The ssr option of XCard must be an object literal - <path>',
    page: 'tools/ssr/static-components'
  },
  {
    phase: 'Build',
    message: 'The ssr.render option of XCard must be the literal false - <path>',
    page: 'tools/ssr/client-only'
  },
  {
    phase: 'Build',
    message: 'The ssr.hydrate option of XCard must be a string literal next to ssr.render - <path>',
    page: 'tools/ssr/progressive-hydration'
  },
  {
    phase: 'Build',
    message: 'XCard must be declared in a file ending with .xd.component.ts - <path>',
    page: 'components/anatomy'
  },
  {
    phase: 'Build',
    message: 'Unsupported stylesheet extension ".styl" for <path>.',
    page: 'components/styling'
  },
  {
    phase: 'Build',
    message: 'The "sass" package is required to compile <path>: install it with "npm i -D sass".',
    page: 'components/styling'
  },
  {
    phase: 'Build',
    message: 'Failed to compile style - <path>',
    page: 'components/styling'
  },
  {
    phase: 'Build',
    message: 'Could not find the static block applying the decorators of class "MyAppRootComponent" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.',
    page: 'tools/build'
  },
  {
    phase: 'Build',
    message: 'Failed to compile component - <path>',
    page: 'tools/build'
  },
  {
    phase: 'Build',
    message: 'Error: Unable to resolve module path "./nope" for "Nope".',
    page: 'templates/imports'
  },
  {
    phase: 'Build',
    message: '<path> does not export render(url): export the function rendering a page on the server',
    page: 'tools/ssr/overview'
  },
  {
    phase: 'TypeChecker',
    message: 'Module \'"<path>"\' has no exported member \'Callout\'.',
    page: 'templates/imports'
  },
  {
    phase: 'TypeChecker',
    message: '\'title\' is also a member of XCard: import it under another name (… as name), or rename the member.',
    page: 'templates/imports'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] "root" is reserved in templates: import it under another name (… as name).',
    page: 'templates/imports'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] "field" is read before the element it names is created: only an event handler can read an element ref declared after it',
    page: 'templates/element-refs'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] The track expression of a @for cannot read the element ref "field": it only reads the item of the @for and its implicit variables',
    page: 'templates/element-refs'
  },
  {
    phase: 'TypeChecker',
    message: "Cannot redeclare block-scoped variable 'field'.",
    page: 'templates/element-refs'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] "row" is not a template visible here: declare it with <template row(…)> in this scope or in an enclosing one',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] Template "row" is declared among HTML elements, and its content cannot be rendered among SVG elements: declare it in the namespace it is rendered in',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] "field" is read by the template rendered by @render row before the element it names is created: render the template after the element, or read the ref from an event handler',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] "total" is read before its @let: only an event handler can read a @let declared after it',
    page: 'templates/let'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] "total" is read by the template rendered by @render row before its @let: render the template after the @let, or read it from an event handler',
    page: 'templates/let'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] The track expression of a @for cannot read the @let "total": it only reads the item of the @for and its implicit variables',
    page: 'templates/let'
  },
  {
    phase: 'TypeChecker',
    message: "Property 'toFixed' does not exist on type 'Computed<number>'.",
    page: 'templates/let'
  },
  {
    phase: 'TypeChecker',
    message: 'Expected 2 arguments, but got 1.',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Runtime',
    message: 'XCard does not seem to have a Render Function',
    page: 'components/registration'
  },
  {
    phase: 'Runtime',
    message: 'ReferenceError: Signal is not defined',
    page: 'installation'
  },
  {
    phase: 'Runtime',
    message: 'Error: No directive registered for selector "exTint"',
    page: 'directives/overview'
  },
  {
    phase: 'Runtime',
    message: 'Error: Directive TintDirective registered for selector "exTint" is not a StructuralDirective',
    page: 'directives/overview'
  },
  {
    phase: 'Runtime',
    message: 'Error: Selector "exTint" is already used by directive TintDirective',
    page: 'directives/overview'
  },
  {
    phase: 'Runtime',
    message: "Error: No element matches the required query 'input' of <x-search>",
    page: 'components/queries'
  },
  {
    phase: 'Runtime',
    message: "Error: No element matches the required content query '[header]' of <x-card>",
    page: 'components/content-queries'
  },
  {
    phase: 'Runtime',
    message: "Error: @HostProperty('class.') names no class",
    page: 'components/host-bindings'
  },
  {
    phase: 'Runtime',
    message: 'Error: @HostEvent() names no event',
    page: 'components/host-bindings'
  },
  {
    phase: 'Runtime',
    message: "Error: @HostProperty('role') cannot decorate the static member defaultRole",
    page: 'components/host-bindings'
  },
  {
    phase: 'Runtime',
    message: "Error: @HostEvent('click') cannot decorate the static method handle",
    page: 'components/host-bindings'
  },
  {
    phase: 'Runtime',
    message: "NotSupportedError: Failed to execute 'define' on 'CustomElementRegistry': the name \"x-card\" has already been used with this registry",
    page: 'components/registration'
  },
  {
    phase: 'Runtime',
    message: "NotSupportedError: Failed to execute 'attachShadow' on 'Element': Shadow root cannot be created on a host which already hosts a shadow tree.",
    page: 'components/anatomy'
  },
  {
    phase: 'Runtime',
    message: '@import rules are not allowed here.',
    page: 'components/styling'
  },
  {
    phase: 'Runtime',
    message: 'ReferenceError: Element ref "field" is read before the element it names is rendered',
    page: 'templates/element-refs'
  },
  {
    phase: 'Runtime',
    message: 'ReferenceError: @let "total" is read before its declaration is rendered',
    page: 'templates/let'
  },
  {
    phase: 'Runtime',
    message: 'ReferenceError: HTMLElement is not defined',
    page: 'tools/ssr/overview'
  },
  {
    phase: 'Runtime',
    message: 'ReferenceError: document is not defined',
    page: 'tools/ssr/overview'
  },
  {
    phase: 'Runtime',
    message: 'ProductPageComponent is not defined: decorate it with @WebComponent, and install the server DOM with loadServerDom() before importing its module',
    page: 'tools/ssr/overview'
  },
  {
    phase: 'Runtime',
    message: 'ProductPageComponent has no template compiled for the server: build its module with the Vite plugin of @xaendar/build-tools in the server environment',
    page: 'tools/ssr/overview'
  },
  {
    phase: 'Runtime',
    message: 'dist/server/entry-server.js does not export render(url): export the function rendering a page on the server from src/entry-server.ts',
    page: 'tools/ssr/deployment'
  },
  {
    phase: 'Runtime',
    message: 'inputs.product.onSave is a function, which cannot be written into the HTML: pass the data it is built from, and build it in the component',
    page: 'tools/ssr/transfer-state'
  },
  {
    phase: 'Runtime',
    message: 'inputs.price is an instance of Money, which cannot be written into the HTML: pass a plain object, an array, a Date, a Map or a Set',
    page: 'tools/ssr/transfer-state'
  },
  {
    phase: 'Runtime',
    message: 'inputs.category contains itself, which cannot be written into the HTML',
    page: 'tools/ssr/transfer-state'
  },
  {
    phase: 'Signals',
    message: 'Circular dependency detected while computing a Computed signal',
    page: 'signals/computed'
  },
  {
    phase: 'Signals',
    message: 'Cannot set value while signals are frozen',
    page: 'signals/options'
  },
  {
    phase: 'Signals',
    message: 'Cannot unwatch a signal that is not being watched',
    page: 'signals/effects'
  },
  {
    phase: 'CLI',
    message: 'Tag <Widget> is not a valid custom element name. Custom element names must: …',
    page: 'tools/cli'
  },
  {
    phase: 'CLI',
    message: 'Tag <font-face> is a reserved tag name and cannot be used as a custom element name.',
    page: 'tools/cli'
  },
  {
    phase: 'CLI',
    message: '✖  Directory "user-card" already exists.',
    page: 'tools/cli'
  },
  {
    phase: 'CLI',
    message: '✖  Invalid style option: styl. Use one of css, scss, sass, less.',
    page: 'tools/cli'
  },
  {
    phase: 'CLI',
    message: '✖  Invalid style "styl" in <path>: use one of css, scss, sass, less.',
    page: 'tools/cli'
  },
  {
    phase: 'CLI',
    message: '✖  The project does not render on the server: declare "ssr": { "entry": "src/entry-server" } in its xaendar.json.',
    page: 'tools/ssr/deployment'
  },
  {
    phase: 'CLI',
    message: '✖  Invalid ssr entry "src/entry-server.ts" in xaendar.json: write it without extension.',
    page: 'tools/ssr/overview'
  },
  {
    phase: 'CLI',
    message: '✖  src/entry-server does not export render(url): export the function rendering a page on the server.',
    page: 'tools/ssr/overview'
  }
];
