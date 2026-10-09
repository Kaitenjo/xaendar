import type { Localized } from '../../../core/router/route-hash.utils';

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
   * The message, as printed; positions and paths are left out.
   */
  readonly message: string;
  /**
   * What causes it.
   */
  readonly cause: Localized;
  /**
   * How to fix it.
   */
  readonly fix: Localized;
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
    cause: {
      en: 'An @ in text starts a block: a keyword written without a space before its parenthesis (@if(…)), a keyword that does not exist (@unless, @empty), or a plain @, as in an email address.',
      it: 'Una @ nel testo apre un blocco: una keyword senza spazio prima della parentesi (@if(…)), una keyword inesistente (@unless, @empty), o una semplice @, come in un indirizzo email.'
    },
    fix: {
      en: "Write a space after the keyword, and an interpolation such as { '@' } for a literal @.",
      it: "Scrivi uno spazio dopo la keyword, e un’interpolazione come { '@' } per una @ letterale."
    },
    page: 'templates/overview'
  },
  {
    phase: 'Lexer',
    message: "[Lexer] Unexpected character 'p' after '/': expected '>' to close self-closing tag",
    cause: {
      en: 'A literal < in text, as in 1 < 2, is read as the start of a tag.',
      it: 'Un < letterale nel testo, come in 1 < 2, viene letto come l’inizio di un tag.'
    },
    fix: {
      en: "Write { '<' }.",
      it: "Scrivi { '<' }."
    },
    page: 'templates/overview'
  },
  {
    phase: 'Lexer',
    message: "[Lexer] Attribute value must start with double quotes '\"'",
    cause: {
      en: 'An attribute value in single quotes, or without quotes.',
      it: 'Il valore di un attributo tra apici singoli, o senza apici.'
    },
    fix: {
      en: 'Use double quotes for every attribute value.',
      it: 'Usa i doppi apici per ogni valore di attributo.'
    },
    page: 'templates/overview'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Event must be included in Double Quotes',
    cause: {
      en: 'A listener with a nested call or an expression as argument, such as go(n()) or go(n() + 1), or with two statements.',
      it: 'Un listener con una chiamata annidata o un’espressione come argomento, come go(n()) o go(n() + 1), o con due istruzioni.'
    },
    fix: {
      en: 'Call a single method, with literals, members, loop variables, property accesses or $event as arguments, and compute the rest in the method.',
      it: 'Chiama un solo metodo, con letterali, membri, variabili del ciclo, accessi a proprietà o $event come argomenti, e calcola il resto nel metodo.'
    },
    page: 'templates/events'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Event handler cannot be empty',
    cause: {
      en: 'An arrow function as listener, such as (click)="() => go()".',
      it: 'Una arrow function come listener, come (click)="() => go()".'
    },
    fix: {
      en: 'Name a method: (click)="go()".',
      it: 'Indica un metodo: (click)="go()".'
    },
    page: 'templates/events'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] No spaces are allowed in event handler name',
    cause: {
      en: 'An assignment as listener, such as (click)="open = true".',
      it: 'Un’assegnazione come listener, come (click)="open = true".'
    },
    fix: {
      en: 'Move the assignment into a method.',
      it: 'Sposta l’assegnazione in un metodo.'
    },
    page: 'templates/events'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Expected { after @import',
    cause: {
      en: 'A default import: @import Card from …',
      it: 'Un import di default: @import Card from …'
    },
    fix: {
      en: 'Use a named import: @import { Card } from …',
      it: 'Usa un import con nome: @import { Card } from …'
    },
    page: 'templates/imports'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Directives cannot be declared inside another directive',
    cause: {
      en: 'A directive written inside the parentheses of another one.',
      it: 'Una direttiva scritta tra le parentesi di un’altra.'
    },
    fix: {
      en: 'Write the directives one after the other on the tag.',
      it: 'Scrivi le direttive una dopo l’altra sul tag.'
    },
    page: 'directives/conditional'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] The properties of a structural directive cannot be bound conditionally',
    cause: {
      en: 'An @if or @switch inside the parentheses of a structural directive.',
      it: 'Un @if o uno @switch tra le parentesi di una direttiva strutturale.'
    },
    fix: {
      en: 'Apply the whole directive inside the condition, once per branch.',
      it: 'Applica l’intera direttiva dentro la condizione, una volta per ramo.'
    },
    page: 'directives/structural'
  },
  {
    phase: 'Lexer',
    message: '[Lexer] Structural directives cannot listen to events: they hold no element to dispatch them on',
    cause: {
      en: 'A listener inside the parentheses of a structural directive.',
      it: 'Un listener tra le parentesi di una direttiva strutturale.'
    },
    fix: {
      en: 'Write the listener on the tag, outside the directive.',
      it: 'Scrivi il listener sul tag, fuori dalla direttiva.'
    },
    page: 'directives/structural'
  },
  {
    phase: 'Parser',
    message: '[Parser] Expected closing tag input while file is over',
    cause: {
      en: 'An element never closed: a void element without />, an unclosed template literal, an interpolation such as { \'{\' }, or an expression starting with a backtick after a space.',
      it: 'Un elemento mai chiuso: un elemento void senza />, un template literal non chiuso, un’interpolazione come { \'{\' }, o un’espressione che inizia con un backtick dopo uno spazio.'
    },
    fix: {
      en: "Self-close void elements (<input />), use { '\\x7B' } for a brace, and write a template literal right after the brace.",
      it: "Chiudi gli elementi void (<input />), usa { '\\x7B' } per una graffa, e scrivi un template literal subito dopo la graffa."
    },
    page: 'templates/overview'
  },
  {
    phase: 'Parser',
    message: '[Parser] Expected closing tag div, found DIV',
    cause: {
      en: 'A closing tag written with a different case.',
      it: 'Un tag di chiusura scritto con maiuscole diverse.'
    },
    fix: {
      en: 'Write opening and closing tags the same way.',
      it: 'Scrivi allo stesso modo il tag di apertura e quello di chiusura.'
    },
    page: 'templates/overview'
  },
  {
    phase: 'Parser',
    message: '[Parser] No transition function for token of type ELSE',
    cause: {
      en: 'An @else not following an @if block.',
      it: 'Un @else che non segue un blocco @if.'
    },
    fix: {
      en: 'Put the @else right after the closing brace of the @if.',
      it: 'Metti l’@else subito dopo la graffa di chiusura dell’@if.'
    },
    page: 'templates/if'
  },
  {
    phase: 'Parser',
    message: '[Parser] Attribute value missing for hidden in: hidden',
    cause: {
      en: 'A valueless attribute right before a structural directive, or an attribute bound to an expression starting with a backtick after a space.',
      it: 'Un attributo senza valore subito prima di una direttiva strutturale, o un attributo legato a un’espressione che inizia con un backtick dopo uno spazio.'
    },
    fix: {
      en: 'Move the attribute after the directive, or give it an empty value; write the backtick right after the brace.',
      it: 'Sposta l’attributo dopo la direttiva, o dagli un valore vuoto; scrivi il backtick subito dopo la graffa.'
    },
    page: 'directives/structural'
  },
  {
    phase: 'Parser',
    message: '[Parser] Attribute "title" is bound more than once on <p>',
    cause: {
      en: 'The same attribute written both outside and inside a conditional binding.',
      it: 'Lo stesso attributo scritto sia fuori sia dentro un binding condizionale.'
    },
    fix: {
      en: 'Bind it only inside the condition, in every branch that needs it.',
      it: 'Legalo solo dentro la condizione, in ogni ramo che ne ha bisogno.'
    },
    page: 'templates/conditional-bindings'
  },
  {
    phase: 'Parser',
    message: '[Parser] Directive "exTint" is applied more than once on <p>',
    cause: {
      en: 'The same directive applied twice to one element.',
      it: 'La stessa direttiva applicata due volte a un elemento.'
    },
    fix: {
      en: 'Apply it once; switch its inputs with a condition if needed.',
      it: 'Applicala una volta; cambia i suoi input con una condizione se serve.'
    },
    page: 'directives/custom'
  },
  {
    phase: 'Parser',
    message: "[Parser] 'user(); as u' must be a single expression, got '; as u' after 'user()'.",
    cause: {
      en: 'More than one expression where one is expected, as in @if (x; as y) or a; b.',
      it: 'Più di un’espressione dove ne è attesa una, come in @if (x; as y) o a; b.'
    },
    fix: {
      en: 'Write a single expression; read the value again inside the block.',
      it: 'Scrivi una sola espressione; rileggi il valore dentro il blocco.'
    },
    page: 'templates/expressions'
  },
  {
    phase: 'Parser',
    message: "[Parser] 'FirstAssignment' is not allowed inside template expressions.",
    cause: {
      en: "A construct forbidden in expressions. The same message names the others: 'new', function expressions, 'ThisKeyword', 'AsExpression', 'RegularExpressionLiteral', 'CommaToken'.",
      it: "Un costrutto vietato nelle espressioni. Lo stesso messaggio nomina gli altri: 'new', function expression, 'ThisKeyword', 'AsExpression', 'RegularExpressionLiteral', 'CommaToken'."
    },
    fix: {
      en: 'Move the logic into a method or a computed signal of the class.',
      it: 'Sposta la logica in un metodo o in un computed della classe.'
    },
    page: 'templates/expressions'
  },
  {
    phase: 'Parser',
    message: "[Parser] 'let i' is not a valid alias identifier.",
    cause: {
      en: 'An alias of @for written with let.',
      it: 'Un alias di @for scritto con let.'
    },
    fix: {
      en: 'Write the alias as i = $index.',
      it: 'Scrivi l’alias come i = $index.'
    },
    page: 'templates/for'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] foreign-thing selector is not associated to any WebComponent imported in the template',
    cause: {
      en: 'A tag with a dash that is not a Xaendar component imported by the template: a missing @import, or a custom element of another library.',
      it: 'Un tag con trattino che non è un componente Xaendar importato dal template: un @import mancante, o un custom element di un’altra libreria.'
    },
    fix: {
      en: 'Import the component; create elements of other libraries in code.',
      it: 'Importa il componente; crea nel codice gli elementi di altre librerie.'
    },
    page: 'templates/imports'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] @@exTint selector is not associated to any Directive imported in the template',
    cause: {
      en: 'A directive used without @import.',
      it: 'Una direttiva usata senza @import.'
    },
    fix: {
      en: 'Import the directive class in the template.',
      it: 'Importa la classe della direttiva nel template.'
    },
    page: 'directives/overview'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] x-card is missing the following required properties: ● name',
    cause: {
      en: 'A required input not bound.',
      it: 'Un input required non legato.'
    },
    fix: {
      en: 'Bind it on the tag.',
      it: 'Legalo sul tag.'
    },
    page: 'components/inputs'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] Required property "name" of <x-card> must always be bound: bind it in every branch of its conditional binding, including an @else or @default one, or outside of it.',
    cause: {
      en: 'A required input bound only in some branches.',
      it: 'Un input required legato solo in alcuni rami.'
    },
    fix: {
      en: 'Add an @else or @default branch binding it, or bind it outside the condition.',
      it: 'Aggiungi un ramo @else o @default che lo lega, o legalo fuori dalla condizione.'
    },
    page: 'templates/conditional-bindings'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] Unknown event "valuechange" on <x-picker> (XPicker has no @Event with this name).',
    cause: {
      en: 'A listener for an event the component does not declare: a different case, an output inherited from a base class, or a native event such as click on a component tag.',
      it: 'Un listener per un evento che il componente non dichiara: maiuscole diverse, un output ereditato da una classe base, o un evento nativo come click sul tag di un componente.'
    },
    fix: {
      en: 'Match the name of the accessor; listen to native events on a wrapper element.',
      it: 'Usa il nome esatto dell’accessor; ascolta gli eventi nativi su un elemento contenitore.'
    },
    page: 'components/outputs'
  },
  {
    phase: 'TypeChecker',
    message: '[TypeChecker] Unknown property "shade" on @@exTint (TintDirective has no @Property with this name).',
    cause: {
      en: 'An input the directive does not declare.',
      it: 'Un input che la direttiva non dichiara.'
    },
    fix: {
      en: 'Use the name of a @Property of the directive.',
      it: 'Usa il nome di una @Property della direttiva.'
    },
    page: 'directives/custom'
  },
  {
    phase: 'TypeChecker',
    message: "Property 'bubbly' does not exist on type 'HTMLElementEventMap'.",
    cause: {
      en: 'A listener for an unknown event on a native element.',
      it: 'Un listener per un evento sconosciuto su un elemento nativo.'
    },
    fix: {
      en: 'Listen to custom events on the component emitting them, or on a component re-emitting them.',
      it: 'Ascolta gli eventi custom sul componente che li emette, o su un componente che li riemette.'
    },
    page: 'components/outputs'
  },
  {
    phase: 'TypeChecker',
    message: "Type 'string' does not satisfy the expected type 'number'.",
    cause: {
      en: 'A static value, always a string, bound to an input of another type.',
      it: 'Un valore statico, sempre una stringa, legato a un input di un altro tipo.'
    },
    fix: {
      en: 'Bind an expression: count="{ 3 }".',
      it: 'Lega un’espressione: count="{ 3 }".'
    },
    page: 'components/inputs'
  },
  {
    phase: 'TypeChecker',
    message: "Cannot find name '$event'. Did you mean 'event'?",
    cause: {
      en: '$event used for an output without a type argument, or as $event.target.',
      it: '$event usato per un output senza argomento di tipo, o come $event.target.'
    },
    fix: {
      en: 'Give the output a type, such as Output<string>; pass $event whole and read the target in the method.',
      it: 'Dai un tipo all’output, come Output<string>; passa $event intero e leggi il target nel metodo.'
    },
    page: 'components/outputs'
  },
  {
    phase: 'TypeChecker',
    message: "Property 'secret' is private and only accessible within class 'XCard'.",
    cause: {
      en: 'A private or protected member read by the template.',
      it: 'Un membro private o protected letto dal template.'
    },
    fix: {
      en: 'Make the member public.',
      it: 'Rendi pubblico il membro.'
    },
    page: 'templates/expressions'
  },
  {
    phase: 'TypeChecker',
    message: "Property 'LIMIT' does not exist on type 'XCard'.",
    cause: {
      en: 'A module constant read by the template, which only sees the members of the class.',
      it: 'Una costante di modulo letta dal template, che vede solo i membri della classe.'
    },
    fix: {
      en: 'Expose it as a member: readonly limit = LIMIT.',
      it: 'Esponila come membro: readonly limit = LIMIT.'
    },
    page: 'templates/expressions'
  },
  {
    phase: 'TypeChecker',
    message: "This comparison appears to be unintentional because the types '1' and '2' have no overlap.",
    cause: {
      en: 'A readonly member initialized with a literal has a literal type, and the template is checked with it.',
      it: 'Un membro readonly inizializzato con un letterale ha un tipo letterale, e il template viene controllato con quello.'
    },
    fix: {
      en: 'Annotate the member with a wider type.',
      it: 'Annota il membro con un tipo più ampio.'
    },
    page: 'templates/expressions'
  },
  {
    phase: 'TypeChecker',
    message: "Argument of type 'Set<number>' is not assignable to parameter of type 'number | readonly unknown[]'.",
    cause: {
      en: '@for over something that is neither an array nor a number: a Set, a Map, a string.',
      it: '@for su qualcosa che non è né un array né un numero: un Set, una Map, una stringa.'
    },
    fix: {
      en: 'Convert it to an array, for instance in a computed signal.',
      it: 'Convertilo in un array, per esempio in un computed.'
    },
    page: 'templates/for'
  },
  {
    phase: 'TypeChecker',
    message: "'this' implicitly has type 'any' because it does not have a type annotation.",
    cause: {
      en: 'A track expression reading a member of the component.',
      it: 'Un’espressione di track che legge un membro del componente.'
    },
    fix: {
      en: 'Track by a field of the item, or by the item itself.',
      it: 'Traccia per un campo dell’elemento, o per l’elemento stesso.'
    },
    page: 'templates/for'
  },
  {
    phase: 'TypeChecker',
    message: "Property '$count' does not exist on type 'XList'.",
    cause: {
      en: '$count is not one of the variables of @for.',
      it: '$count non è una delle variabili di @for.'
    },
    fix: {
      en: 'Read the length of the list.',
      it: 'Leggi la lunghezza della lista.'
    },
    page: 'templates/for'
  },
  {
    phase: 'TypeChecker',
    message: "Cannot find name 'first'.",
    cause: {
      en: 'A member of the component as the value of an @case, which only accepts literals.',
      it: 'Un membro del componente come valore di un @case, che accetta solo letterali.'
    },
    fix: {
      en: 'Write the literal, or use @if.',
      it: 'Scrivi il letterale, o usa @if.'
    },
    page: 'templates/switch'
  },
  {
    phase: 'TypeChecker',
    message: "'root.prices.coffee' is possibly 'undefined'.",
    cause: {
      en: 'The strict options of tsconfig.json, such as noUncheckedIndexedAccess, apply to templates too.',
      it: 'Le opzioni strict di tsconfig.json, come noUncheckedIndexedAccess, valgono anche per i template.'
    },
    fix: {
      en: 'Use ?. or ??, or a precise type.',
      it: 'Usa ?. o ??, o un tipo preciso.'
    },
    page: 'templates/expressions'
  },
  {
    phase: 'Generator',
    message: '[Generator] Signal field "step" is already declared in this scope.',
    cause: {
      en: 'A signal member declared both by a class and by the class it extends.',
      it: 'Un membro signal dichiarato sia da una classe sia dalla classe che estende.'
    },
    fix: {
      en: 'Declare it once; in the base class, type it as a function.',
      it: 'Dichiaralo una volta; nella classe base, tipizzalo come funzione.'
    },
    page: 'components/inheritance'
  },
  {
    phase: 'Build',
    message: 'Invalid custom element name "laberr" in component <path>',
    cause: {
      en: 'A selector that is not a valid custom element name.',
      it: 'Un selettore che non è un nome valido per un custom element.'
    },
    fix: {
      en: 'Use lowercase letters and at least one dash.',
      it: 'Usa lettere minuscole e almeno un trattino.'
    },
    page: 'components/registration'
  },
  {
    phase: 'Build',
    message: 'Selector "x-card" of component "A" - <path> is already used by component "B" - <path>. Custom element names must be unique.',
    cause: {
      en: 'Two components with the same selector.',
      it: 'Due componenti con lo stesso selettore.'
    },
    fix: {
      en: 'Rename one of them.',
      it: 'Rinominane uno.'
    },
    page: 'components/registration'
  },
  {
    phase: 'Build',
    message: 'Selector "exTint" of directive "A" - <path> is already used by directive "B" - <path>. Directive selectors must be unique.',
    cause: {
      en: 'Two directives with the same selector.',
      it: 'Due direttive con lo stesso selettore.'
    },
    fix: {
      en: 'Rename one of them, ideally with a prefix.',
      it: 'Rinominane una, meglio se con un prefisso.'
    },
    page: 'directives/overview'
  },
  {
    phase: 'Build',
    message: 'Could not find template at <path>',
    cause: {
      en: 'A templateUrl pointing to a missing file.',
      it: 'Un templateUrl che punta a un file inesistente.'
    },
    fix: {
      en: 'Fix the path, relative to the file of the component.',
      it: 'Correggi il percorso, relativo al file del componente.'
    },
    page: 'components/registration'
  },
  {
    phase: 'Build',
    message: 'Unsupported stylesheet extension ".scss" for <path>.',
    cause: {
      en: 'A styleUrl that is not a .css file.',
      it: 'Uno styleUrl che non è un file .css.'
    },
    fix: {
      en: 'Use plain CSS.',
      it: 'Usa CSS semplice.'
    },
    page: 'components/styling'
  },
  {
    phase: 'Build',
    message: 'Could not find the static initializer block for class "MyAppRootComponent" in the transpiled output. Make sure @rolldown/plugin-babel with @babel/plugin-proposal-decorators runs before xaendarPlugin() in your Vite config.',
    cause: {
      en: 'The decorators were not compiled before the Xaendar plugin ran.',
      it: 'I decoratori non sono stati compilati prima del plugin Xaendar.'
    },
    fix: {
      en: 'Put the Babel plugin before xaendarPlugin().',
      it: 'Metti il plugin Babel prima di xaendarPlugin().'
    },
    page: 'tools/build'
  },
  {
    phase: 'Build',
    message: 'Error: Unable to resolve module path for "Nope".',
    cause: {
      en: 'An @import whose path does not resolve: only relative paths to files or folders are supported.',
      it: 'Un @import il cui percorso non si risolve: sono supportati solo percorsi relativi a file o cartelle.'
    },
    fix: {
      en: 'Use a relative path; packages and tsconfig aliases are not resolved.',
      it: 'Usa un percorso relativo; pacchetti e alias del tsconfig non vengono risolti.'
    },
    page: 'templates/imports'
  },
  {
    phase: 'Build',
    message: 'Class "Callout" was not found in the import from <path>',
    cause: {
      en: 'An @import naming a class the file does not declare, or a type.',
      it: 'Un @import che nomina una classe che il file non dichiara, o un tipo.'
    },
    fix: {
      en: 'Import the component or directive class by its exact name.',
      it: 'Importa la classe del componente o della direttiva con il suo nome esatto.'
    },
    page: 'templates/imports'
  },
  {
    phase: 'Build',
    message: 'Unterminated string constant',
    cause: {
      en: "Reported by Babel on the generated code for an interpolation such as { '}' }: the brace inside the string ends the interpolation.",
      it: "Segnalato da Babel sul codice generato per un’interpolazione come { '}' }: la graffa nella stringa chiude l’interpolazione."
    },
    fix: {
      en: "Write { '\\x7D' }.",
      it: "Scrivi { '\\x7D' }."
    },
    page: 'templates/text-interpolation'
  },
  {
    phase: 'Runtime',
    message: 'XCard does not seems to have a Render Function',
    cause: {
      en: 'The template of the component did not compile, its templateUrl is not a string literal, its file does not end with .xd.component.ts, or the class is a subclass without its own @WebComponent.',
      it: 'Il template del componente non è stato compilato, il suo templateUrl non è una stringa letterale, il suo file non termina con .xd.component.ts, o la classe è una sottoclasse senza un proprio @WebComponent.'
    },
    fix: {
      en: 'Look for the compiler message printed before it.',
      it: 'Cerca il messaggio del compilatore stampato prima.'
    },
    page: 'components/registration'
  },
  {
    phase: 'Runtime',
    message: 'ReferenceError: Signal is not defined',
    cause: {
      en: 'loadSignals() did not run before @xaendar/core was loaded.',
      it: 'loadSignals() non è stato eseguito prima del caricamento di @xaendar/core.'
    },
    fix: {
      en: 'Call it in a module loaded before the application.',
      it: 'Chiamalo in un modulo caricato prima dell’applicazione.'
    },
    page: 'installation'
  },
  {
    phase: 'Runtime',
    message: 'Error: No directive registered for selector "exTint"',
    cause: {
      en: 'The template imports the directive, but its module was never loaded at runtime.',
      it: 'Il template importa la direttiva, ma il suo modulo non è mai stato caricato a runtime.'
    },
    fix: {
      en: 'Import the module, for instance with the glob of main.ts.',
      it: 'Importa il modulo, per esempio con il glob di main.ts.'
    },
    page: 'directives/overview'
  },
  {
    phase: 'Runtime',
    message: 'Error: Directive TintDirective registered for selector "exTint" is not a StructuralDirective',
    cause: {
      en: 'A custom directive applied with *, or a structural one with @@.',
      it: 'Una direttiva custom applicata con *, o una strutturale con @@.'
    },
    fix: {
      en: 'Use @@ for CustomDirective and * for StructuralDirective.',
      it: 'Usa @@ per CustomDirective e * per StructuralDirective.'
    },
    page: 'directives/overview'
  },
  {
    phase: 'Runtime',
    message: 'Error: Selector "exTint" is already used by directive TintDirective',
    cause: {
      en: 'Two directive classes registered with the same selector.',
      it: 'Due classi direttiva registrate con lo stesso selettore.'
    },
    fix: {
      en: 'Rename one of them.',
      it: 'Rinominane una.'
    },
    page: 'directives/overview'
  },
  {
    phase: 'Runtime',
    message: "TypeError: Cannot read properties of undefined (reading 'addUnlistener')",
    cause: {
      en: 'this.effect called in the constructor of a directive, before its context exists.',
      it: 'this.effect chiamato nel costruttore di una direttiva, prima che esista il suo contesto.'
    },
    fix: {
      en: 'Create effects in onInit.',
      it: 'Crea gli effect in onInit.'
    },
    page: 'directives/custom'
  },
  {
    phase: 'Runtime',
    message: "TypeError: Cannot read properties of undefined (reading 'bind')",
    cause: {
      en: 'A listener calling a method of a member, such as (click)="helper.run()": it compiles, and fails at the click.',
      it: 'Un listener che chiama un metodo di un membro, come (click)="helper.run()": compila, e fallisce al clic.'
    },
    fix: {
      en: 'Call a method of the component, which calls the helper.',
      it: 'Chiama un metodo del componente, che chiama l’helper.'
    },
    page: 'templates/events'
  },
  {
    phase: 'Runtime',
    message: 'TypeError: stop is not a function',
    cause: {
      en: 'A query created with query() after the component was connected, thrown at the next disconnection.',
      it: 'Una query creata con query() dopo la connessione del componente, lanciato alla disconnessione successiva.'
    },
    fix: {
      en: 'Create queries in field initializers.',
      it: 'Crea le query negli inizializzatori dei campi.'
    },
    page: 'components/queries'
  },
  {
    phase: 'Runtime',
    message: 'RangeError: Maximum call stack size exceeded',
    cause: {
      en: 'An @if with an @else nested directly inside an @else.',
      it: 'Un @if con un @else annidato direttamente dentro un @else.'
    },
    fix: {
      en: 'Use @else if, or wrap the nested block in an element.',
      it: 'Usa @else if, o avvolgi il blocco annidato in un elemento.'
    },
    page: 'templates/if'
  },
  {
    phase: 'Runtime',
    message: 'ReferenceError: DEFAULT_LEVEL is not defined',
    cause: {
      en: 'An input whose default is not a literal, bound conditionally by a parent: the default is copied into the code of the parent.',
      it: 'Un input il cui default non è un letterale, legato in modo condizionale da un padre: il default viene copiato nel codice del padre.'
    },
    fix: {
      en: 'Write the default as a literal.',
      it: 'Scrivi il default come letterale.'
    },
    page: 'templates/conditional-bindings'
  },
  {
    phase: 'Runtime',
    message: "NotSupportedError: Failed to execute 'define' on 'CustomElementRegistry': the name \"x-card\" has already been used with this registry",
    cause: {
      en: 'Two classes defined with the same selector at runtime.',
      it: 'Due classi definite con lo stesso selettore a runtime.'
    },
    fix: {
      en: 'Rename one of them.',
      it: 'Rinominane una.'
    },
    page: 'components/registration'
  },
  {
    phase: 'Runtime',
    message: "NotSupportedError: Failed to execute 'attachShadow' on 'Element': Shadow root cannot be created on a host which already hosts a shadow tree.",
    cause: {
      en: 'attachShadow called by a component, which already has an open shadow root.',
      it: 'attachShadow chiamato da un componente, che ha già una shadow root aperta.'
    },
    fix: {
      en: 'Use this.shadowRoot.',
      it: 'Usa this.shadowRoot.'
    },
    page: 'components/anatomy'
  },
  {
    phase: 'Runtime',
    message: '@import rules are not allowed here.',
    cause: {
      en: 'A browser warning: a component stylesheet is a constructed stylesheet, which drops @import rules.',
      it: 'Un avviso del browser: il foglio di stile di un componente è un foglio costruito, che scarta le regole @import.'
    },
    fix: {
      en: 'Put every rule in the CSS file of the component.',
      it: 'Metti ogni regola nel file CSS del componente.'
    },
    page: 'components/styling'
  },
  {
    phase: 'Signals',
    message: 'Circular dependency detected while computing a Computed signal',
    cause: {
      en: 'A computed signal reading itself, directly or through others.',
      it: 'Un computed che legge sé stesso, direttamente o attraverso altri.'
    },
    fix: {
      en: 'Break the cycle with a writable signal.',
      it: 'Spezza il ciclo con un signal scrivibile.'
    },
    page: 'signals/computed'
  },
  {
    phase: 'Signals',
    message: 'Cannot set value while signals are frozen',
    cause: {
      en: 'A signal written, or read (Cannot get value…), inside watched, unwatched or Watcher.notify.',
      it: 'Un signal scritto, o letto (Cannot get value…), dentro watched, unwatched o Watcher.notify.'
    },
    fix: {
      en: 'Defer the work with queueMicrotask.',
      it: 'Rimanda il lavoro con queueMicrotask.'
    },
    page: 'signals/options'
  },
  {
    phase: 'Signals',
    message: 'Cannot unwatch a signal that is not being watched',
    cause: {
      en: 'The disposer of a standalone effect called twice.',
      it: 'Il disposer di un effect standalone chiamato due volte.'
    },
    fix: {
      en: 'Call it once.',
      it: 'Chiamalo una volta sola.'
    },
    page: 'signals/effects'
  },
  {
    phase: 'Signals',
    message: 'TypeError: signal.getSinks is not a function',
    cause: {
      en: 'Signal.subtle.introspectSinks given the function returned by signal() or computed().',
      it: 'Signal.subtle.introspectSinks chiamato con la funzione restituita da signal() o computed().'
    },
    fix: {
      en: 'Use Signal.State and Signal.Computed for introspection.',
      it: 'Usa Signal.State e Signal.Computed per l’introspezione.'
    },
    page: 'signals/advanced'
  },
  {
    phase: 'CLI',
    message: "error: unknown command 'generate'",
    cause: {
      en: 'The component command is registered at the top level.',
      it: 'Il comando dei componenti è registrato al livello principale.'
    },
    fix: {
      en: 'Run xd component <name>, or xd c <name>.',
      it: 'Esegui xd component <nome>, o xd c <nome>.'
    },
    page: 'tools/cli'
  },
  {
    phase: 'CLI',
    message: 'Tag <Widget> is not a valid custom element name. Custom element names must: …',
    cause: {
      en: 'A component name, or a project name followed by -root, that is not a valid custom element name.',
      it: 'Un nome di componente, o un nome di progetto seguito da -root, che non è un nome valido per un custom element.'
    },
    fix: {
      en: 'Use lowercase letters and a dash.',
      it: 'Usa lettere minuscole e un trattino.'
    },
    page: 'tools/cli'
  },
  {
    phase: 'CLI',
    message: 'Tag <font-face> is a reserved tag name and cannot be used as a custom element name.',
    cause: {
      en: 'One of the names reserved by the HTML specification.',
      it: 'Uno dei nomi riservati dalla specifica HTML.'
    },
    fix: {
      en: 'Pick another name.',
      it: 'Scegli un altro nome.'
    },
    page: 'tools/cli'
  },
  {
    phase: 'CLI',
    message: '✖  Directory "user-card" already exists.',
    cause: {
      en: 'xd component would overwrite an existing folder.',
      it: 'xd component sovrascriverebbe una cartella esistente.'
    },
    fix: {
      en: 'Pick another name, or add --force to replace it.',
      it: 'Scegli un altro nome, o aggiungi --force per sostituirla.'
    },
    page: 'tools/cli'
  },
  {
    phase: 'CLI',
    message: '✖  Invalid style option: sass',
    cause: {
      en: 'xd new accepts css, scss, less and styl.',
      it: 'xd new accetta css, scss, less e styl.'
    },
    fix: {
      en: 'Use css: it is the only extension the plugin compiles.',
      it: 'Usa css: è l’unica estensione che il plugin compila.'
    },
    page: 'tools/cli'
  }
];
