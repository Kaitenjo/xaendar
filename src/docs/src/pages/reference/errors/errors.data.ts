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
    message: '[Lexer] A template variable takes no value: write #name, which names the element it is declared on',
    page: 'templates/template-variables'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] A template variable names the element whatever branch is selected: declare #name among the bindings of the tag, outside of its conditional bindings',
    page: 'templates/template-variables'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Only a <template> declares parameters, e.g. <template #row(item: Item)>: on any other element a template variable is just #name',
    page: 'templates/template-variables'
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
    message: '[Parser] <input> declares more than one template variable (#first, #second): an element has a single name',
    page: 'templates/template-variables'
  },
  {
    phase: 'Parser',
    message: '[Parser] <div> cannot declare #panel: its structural directives may not render it. Declare the variable on an element inside it, whose content is a scope of its own',
    page: 'templates/template-variables'
  },
  {
    phase: 'Parser',
    message: "[Parser] '2fields' is not a valid name for a template variable: it must be an identifier.",
    page: 'templates/template-variables'
  },
  {
    phase: 'Parser',
    message: "[Parser] '2total' is not a valid name for a @let: it must be an identifier.",
    page: 'templates/let'
  },
  {
    phase: 'Parser',
    message: '[Parser] A <template> declares a template: name it and list its parameters, e.g. <template #row(item: Item)>, then render it with @render row(item())',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] A template lists its parameters in parentheses after its name, even when it has none: <template #row()>',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] A <template> declares only its name and its parameters, e.g. <template #row(item: Item)>: it renders nothing where it is declared, but where a @render calls it',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'Parser',
    message: '[Parser] The parameters of a template are declared like the ones of a function, each one with its type, e.g. <template #row(item: Item, index: number)>',
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
    message: "Cannot find name '$event'. Did you mean 'event'?",
    page: 'components/outputs'
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
    message: 'Invalid custom element name "laberr" in component <path>',
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
    phase: 'Build',
    message: 'Could not find template at <path>',
    page: 'components/registration'
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
    message: 'XCard must be declared in a file ending with .xd.component.ts - <path>',
    page: 'components/anatomy'
  },
  {
    phase: 'Build',
    message: 'Unsupported stylesheet extension ".scss" for <path>.',
    page: 'components/styling'
  },
  {
    phase: 'Build',
    message: 'Could not find the static initializer block for class "MyAppRootComponent" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.',
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
    message: '[TypeChecker] "field" is read before the element it names is created: only an event handler can read a template variable declared after it',
    page: 'templates/template-variables'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] The track expression of a @for cannot read the template variable "field": it only reads the item of the @for and its implicit variables',
    page: 'templates/template-variables'
  },
  {
    phase: 'TypeChecker',
    message: "Cannot redeclare block-scoped variable 'field'.",
    page: 'templates/template-variables'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] "row" is not a template visible here: declare it with <template #row(…)> in this scope or in an enclosing one',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] Template "row" is declared among HTML elements, and its content cannot be rendered among SVG elements: declare it in the namespace it is rendered in',
    page: 'templates/reusable-templates'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] "field" is read by the template rendered by @render row before the element it names is created: render the template after the element, or read the variable from an event handler',
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
    message: 'XCard does not seems to have a Render Function',
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
    message: "TypeError: Cannot read properties of undefined (reading 'addUnlistener')",
    page: 'directives/custom'
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
    message: 'ReferenceError: Template variable "field" is read before the element it names is rendered',
    page: 'templates/template-variables'
  },
  {
    phase: 'Runtime',
    message: 'ReferenceError: @let "total" is read before its declaration is rendered',
    page: 'templates/let'
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
    message: '✖  Invalid style option: sass',
    page: 'tools/cli'
  }
];
