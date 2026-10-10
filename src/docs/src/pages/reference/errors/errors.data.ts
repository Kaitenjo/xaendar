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
    message: '[Parser] Attribute value missing for hidden in: hidden',
    page: 'directives/structural'
  },
  {
    phase: 'Parser',
    message: '[Parser] Attribute "title" is bound more than once on <p>',
    page: 'templates/conditional-bindings'
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
    phase: 'TypeChecker',
    message: '[TypeChecker] foreign-thing selector is not associated to any WebComponent imported in the template',
    page: 'templates/imports'
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
    message: '[TypeChecker] Unknown event "valuechange" on <x-picker> (XPicker has no @Event with this name).',
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
    message: "'this' implicitly has type 'any' because it does not have a type annotation.",
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
    phase: 'Generator',
    message: '[Generator] Signal field "step" is already declared in this scope.',
    page: 'components/inheritance'
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
    message: 'Error: Unable to resolve module path for "Nope".',
    page: 'templates/imports'
  },
  {
    phase: 'Build',
    message: 'Class "Callout" was not found in the import from <path>',
    page: 'templates/imports'
  },
  {
    phase: 'Build',
    message: 'Unterminated string constant',
    page: 'templates/text-interpolation'
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
    message: "TypeError: Cannot read properties of undefined (reading 'addUnlistener')",
    page: 'directives/custom'
  },
  {
    phase: 'Runtime',
    message: "TypeError: Cannot read properties of undefined (reading 'bind')",
    page: 'templates/events'
  },
  {
    phase: 'Runtime',
    message: 'TypeError: stop is not a function',
    page: 'components/queries'
  },
  {
    phase: 'Runtime',
    message: 'ReferenceError: DEFAULT_LEVEL is not defined',
    page: 'templates/conditional-bindings'
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
    phase: 'Signals',
    message: 'TypeError: signal.getSinks is not a function',
    page: 'signals/advanced'
  },
  {
    phase: 'CLI',
    message: "error: unknown command 'generate'",
    page: 'tools/cli'
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
