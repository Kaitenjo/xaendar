import type { Localized } from '../../../core/router/route-hash.utils';

/**
 * The kinds of known issues.
 */
export type IssueKind = 'bug' | 'limitation' | 'docs';

/**
 * A problem of the framework or of its tools, as found while writing this site.
 */
export type IssueEntry = {
  /**
   * The area of the framework involved.
   */
  readonly area: 'Compiler' | 'Runtime' | 'Signals' | 'Build' | 'CLI' | 'Editor' | 'Docs';
  /**
   * Whether it is a defect, a limitation of the design, or a documentation mismatch.
   */
  readonly kind: IssueKind;
  /**
   * A one-line summary.
   */
  readonly title: Localized;
  /**
   * What happens.
   */
  readonly details: Localized;
  /**
   * How to avoid it, if possible.
   */
  readonly workaround: Localized;
  /**
   * The path of the page showing it.
   */
  readonly page: string;
};

/**
 * Every known issue, verified while writing the site, grouped by area.
 */
export const ISSUES: readonly IssueEntry[] = [
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'An @if/@else nested directly in an @else recurses forever', it: 'Un @if/@else annidato direttamente in un @else ricorre all’infinito' },
    details: {
      en: 'The generated functions of the inner branches get the same names as the outer ones: the wrong branches are shown, then RangeError: Maximum call stack size exceeded.',
      it: 'Le funzioni generate dei rami interni prendono gli stessi nomi di quelli esterni: vengono mostrati i rami sbagliati, poi RangeError: Maximum call stack size exceeded.'
    },
    workaround: { en: 'Use @else if, or wrap the inner block in an element.', it: 'Usa @else if, o avvolgi il blocco interno in un elemento.' },
    page: 'templates/if'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'Branches of @else if and @else share generated names', it: 'I rami di @else if e @else condividono i nomi generati' },
    details: {
      en: 'Top-level elements of those branches are named after the parent of the block: branches with the same tag in the same position show the text of the last branch, and an element can clash with a sibling of the block.',
      it: 'Gli elementi di primo livello di quei rami prendono il nome dal genitore del blocco: rami con lo stesso tag nella stessa posizione mostrano il testo dell’ultimo ramo, e un elemento può collidere con un fratello del blocco.'
    },
    workaround: { en: 'Use @switch, give the branches different tags, or wrap the block in an element.', it: 'Usa @switch, dai tag diversi ai rami, o avvolgi il blocco in un elemento.' },
    page: 'templates/if'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'Types of inputs and outputs are copied as text', it: 'I tipi di input e output vengono copiati come testo' },
    details: {
      en: 'The type argument of a @Property or @Event accessor is pasted into the check of the templates using the component, where the names it uses do not exist: Cannot find name.',
      it: 'L’argomento di tipo di un accessor @Property o @Event viene incollato nel controllo dei template che usano il componente, dove i nomi che usa non esistono: Cannot find name.'
    },
    workaround: { en: 'Write the types inline in the generic argument.', it: 'Scrivi i tipi inline nell’argomento generico.' },
    page: 'components/inputs'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'Inherited inputs and outputs are ignored by the type checker', it: 'Input e output ereditati vengono ignorati dal type checker' },
    details: {
      en: 'An @Event declared by a base class is reported as unknown on the tag of the subclass, and an inherited @Property is not type-checked.',
      it: 'Un @Event dichiarato da una classe base viene segnalato come sconosciuto sul tag della sottoclasse, e una @Property ereditata non viene controllata.'
    },
    workaround: { en: 'Declare inputs and outputs in the decorated class.', it: 'Dichiara input e output nella classe decorata.' },
    page: 'components/inheritance'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'A signal declared again in a subclass breaks the template', it: 'Un signal ridichiarato in una sottoclasse rompe il template' },
    details: {
      en: 'The signal is listed twice: [Generator] Signal field "x" is already declared in this scope. Unlike other template errors, it stops xd build.',
      it: 'Il signal viene elencato due volte: [Generator] Signal field "x" is already declared in this scope. A differenza degli altri errori dei template, ferma xd build.'
    },
    workaround: { en: 'In the base class, type the member as a function.', it: 'Nella classe base, tipizza il membro come funzione.' },
    page: 'components/inheritance'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'A non-literal default is copied into the parent', it: 'Un default non letterale viene copiato nel padre' },
    details: {
      en: 'When a parent binds an input conditionally, the default written in @Property is pasted into the code of the parent, where the names it uses are undefined: ReferenceError at render.',
      it: 'Quando un padre lega un input in modo condizionale, il default scritto in @Property viene incollato nel codice del padre, dove i nomi che usa non sono definiti: ReferenceError al render.'
    },
    workaround: { en: 'Write defaults as literals.', it: 'Scrivi i default come letterali.' },
    page: 'templates/conditional-bindings'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'A listener calling a method of a member fails at runtime', it: 'Un listener che chiama un metodo di un membro fallisce a runtime' },
    details: {
      en: '(click)="helper.run()" compiles, then throws TypeError: Cannot read properties of undefined (reading \'bind\') at the click.',
      it: '(click)="helper.run()" compila, poi lancia TypeError: Cannot read properties of undefined (reading \'bind\') al clic.'
    },
    workaround: { en: 'Call a method of the component.', it: 'Chiama un metodo del componente.' },
    page: 'templates/events'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'An expression starting with a backtick after a space', it: 'Un’espressione che inizia con un backtick dopo uno spazio' },
    details: {
      en: '{ `text` } in text or in an attribute is not parsed: Expected closing tag, or Attribute value missing.',
      it: '{ `testo` } nel testo o in un attributo non viene analizzato: Expected closing tag, o Attribute value missing.'
    },
    workaround: { en: 'Write the backtick right after the brace, or start with another operand.', it: 'Scrivi il backtick subito dopo la graffa, o inizia con un altro operando.' },
    page: 'templates/text-interpolation'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'Braces inside strings of an interpolation', it: 'Graffe dentro le stringhe di un’interpolazione' },
    details: {
      en: "The braces are counted even inside strings: { '}' } produces invalid code (Unterminated string constant), { '{' } an unclosed element.",
      it: "Le graffe vengono contate anche dentro le stringhe: { '}' } produce codice non valido (Unterminated string constant), { '{' } un elemento non chiuso."
    },
    workaround: { en: "Use { '\\x7B' } and { '\\x7D' }; balanced braces are fine.", it: "Usa { '\\x7B' } e { '\\x7D' }; le graffe bilanciate vanno bene." },
    page: 'templates/text-interpolation'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'Nested template literals', it: 'Template literal annidati' },
    details: {
      en: 'A template literal inside another one is rejected as more than one expression, with a duplicated backtick in the message.',
      it: 'Un template literal dentro un altro viene rifiutato come più di un’espressione, con un backtick duplicato nel messaggio.'
    },
    workaround: { en: 'Build the inner string in a method.', it: 'Costruisci la stringa interna in un metodo.' },
    page: 'templates/text-interpolation'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'An unclosed comment truncates the template silently', it: 'Un commento non chiuso tronca il template in silenzio' },
    details: {
      en: 'Everything after <!-- without --> disappears, with no error.',
      it: 'Tutto ciò che segue <!-- senza --> sparisce, senza errori.'
    },
    workaround: { en: 'Close every comment.', it: 'Chiudi ogni commento.' },
    page: 'templates/overview'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'A valueless attribute before a structural directive', it: 'Un attributo senza valore prima di una direttiva strutturale' },
    details: {
      en: '<span hidden *dir(…)> fails with Attribute value missing for hidden.',
      it: '<span hidden *dir(…)> fallisce con Attribute value missing for hidden.'
    },
    workaround: { en: 'Write the attribute after the directive, or as hidden="".', it: 'Scrivi l’attributo dopo la direttiva, o come hidden="".' },
    page: 'directives/structural'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'HTML inside foreignObject is created as SVG', it: 'L’HTML dentro foreignObject viene creato come SVG' },
    details: {
      en: 'The children of <foreignObject> stay in the SVG namespace, so the browser does not render them as HTML.',
      it: 'I figli di <foreignObject> restano nel namespace SVG, quindi il browser non li renderizza come HTML.'
    },
    workaround: { en: 'Position HTML over the SVG with CSS, or create it in code.', it: 'Posiziona l’HTML sopra l’SVG con il CSS, o crealo nel codice.' },
    page: 'templates/svg-mathml'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'A space between two interpolations disappears', it: 'Lo spazio tra due interpolazioni sparisce' },
    details: {
      en: '{ a } { b } renders the two values joined.',
      it: '{ a } { b } renderizza i due valori uniti.'
    },
    workaround: { en: "Write { a + ' ' + b }, or put other text between them.", it: "Scrivi { a + ' ' + b }, o metti altro testo tra le due." },
    page: 'templates/text-interpolation'
  },
  {
    area: 'Compiler',
    kind: 'bug',
    title: { en: 'A shorthand object in an interpolation renders nothing', it: 'Un oggetto abbreviato in un’interpolazione non renderizza nulla' },
    details: {
      en: '{ {b} } compiles, and renders an empty text.',
      it: '{ {b} } compila, e renderizza un testo vuoto.'
    },
    workaround: { en: 'Write the object in full, or format it in a method.', it: 'Scrivi l’oggetto per esteso, o formattalo in un metodo.' },
    page: 'templates/text-interpolation'
  },
  {
    area: 'Compiler',
    kind: 'limitation',
    title: { en: 'Newlines are removed and entities are not decoded', it: 'Gli a capo vengono rimossi e le entità non vengono decodificate' },
    details: {
      en: 'A line break in text joins the words around it, and &lt; is shown as written. Text cannot contain a literal @, { or <.',
      it: 'Un a capo nel testo unisce le parole che lo circondano, e &lt; viene mostrato così com’è. Il testo non può contenere @, { o < letterali.'
    },
    workaround: { en: "Indent wrapped lines, and use interpolations such as { '@' } and Unicode characters.", it: "Indenta le righe a capo, e usa interpolazioni come { '@' } e caratteri Unicode." },
    page: 'templates/overview'
  },
  {
    area: 'Compiler',
    kind: 'limitation',
    title: { en: 'Signal members are detected by syntax', it: 'I membri signal vengono riconosciuti dalla sintassi' },
    details: {
      en: 'An attribute is reactive only if it names a member initialized by a function of @xaendar/core/signals, or annotated with one of its types. A module signal assigned to an unannotated member, or a member initialized by another function such as queryAll, is read once.',
      it: 'Un attributo è reattivo solo se nomina un membro inizializzato da una funzione di @xaendar/core/signals, o annotato con uno dei suoi tipi. Un signal di modulo assegnato a un membro non annotato, o un membro inizializzato da un’altra funzione come queryAll, viene letto una volta.'
    },
    workaround: { en: 'Annotate the member with Signal<T> or Computed<T>, or wrap it in computed().', it: 'Annota il membro con Signal<T> o Computed<T>, o avvolgilo in computed().' },
    page: 'signals/shared-state'
  },
  {
    area: 'Compiler',
    kind: 'limitation',
    title: { en: 'A method reading signals is evaluated once in an attribute', it: 'Un metodo che legge signal viene valutato una volta in un attributo' },
    details: {
      en: 'In text, any expression is reactive; in an attribute, only one naming a signal member.',
      it: 'Nel testo ogni espressione è reattiva; in un attributo, solo una che nomina un membro signal.'
    },
    workaround: { en: 'Turn the method into a computed signal.', it: 'Trasforma il metodo in un computed.' },
    page: 'templates/binding'
  },
  {
    area: 'Compiler',
    kind: 'limitation',
    title: { en: 'Members named history or location', it: 'Membri chiamati history o location' },
    details: {
      en: 'In a template, these names resolve to the globals of the browser, even when the component declares them.',
      it: 'In un template questi nomi si riferiscono ai globali del browser, anche quando il componente li dichiara.'
    },
    workaround: { en: 'Pick other names.', it: 'Scegli altri nomi.' },
    page: 'templates/expressions'
  },
  {
    area: 'Compiler',
    kind: 'limitation',
    title: { en: 'Output without a type: no $event', it: 'Output senza tipo: niente $event' },
    details: {
      en: 'The listener of an Output with no type argument cannot use $event, so it cannot cancel or inspect the event.',
      it: 'Il listener di un Output senza argomento di tipo non può usare $event, quindi non può annullare né ispezionare l’evento.'
    },
    workaround: { en: 'Give the output a type, even a simple one.', it: 'Dai un tipo all’output, anche semplice.' },
    page: 'components/outputs'
  },
  {
    area: 'Compiler',
    kind: 'limitation',
    title: { en: 'Every tag with a dash must be an imported Xaendar component', it: 'Ogni tag con trattino deve essere un componente Xaendar importato' },
    details: {
      en: 'Custom elements of other libraries are rejected by the type checker, and so are native events on the tag of a component.',
      it: 'I custom element di altre librerie vengono rifiutati dal type checker, e così gli eventi nativi sul tag di un componente.'
    },
    workaround: { en: 'Create foreign elements in code; listen to native events on a wrapper.', it: 'Crea gli elementi esterni nel codice; ascolta gli eventi nativi su un contenitore.' },
    page: 'components/registration'
  },
  {
    area: 'Runtime',
    kind: 'bug',
    title: { en: 'A child is rendered before the bindings of its parent', it: 'Un figlio viene renderizzato prima dei binding del padre' },
    details: {
      en: 'In onInit, and in the first render, inputs hold their defaults and required ones are undefined. An exception in the first run of a binding stops the rest of the template of the child for good. Events emitted in onInit or afterRender are lost.',
      it: 'In onInit, e nel primo render, gli input hanno i default e quelli required sono undefined. Un’eccezione nella prima esecuzione di un binding ferma per sempre il resto del template del figlio. Gli eventi emessi in onInit o afterRender vanno persi.'
    },
    workaround: { en: 'Read inputs reactively, use ?. on required ones, and emit after a microtask.', it: 'Leggi gli input in modo reattivo, usa ?. su quelli required, ed emetti dopo un microtask.' },
    page: 'components/inputs'
  },
  {
    area: 'Runtime',
    kind: 'bug',
    title: { en: 'Rows of @for keep the item they were created with', it: 'Le righe di @for mantengono l’elemento con cui sono state create' },
    details: {
      en: 'A new object with the same key does not update its row, and track $index shows stale rows when items are prepended. Duplicate keys corrupt the list.',
      it: 'Un nuovo oggetto con la stessa chiave non aggiorna la sua riga, e track $index mostra righe stantie quando si antepongono elementi. Chiavi duplicate corrompono la lista.'
    },
    workaround: { en: 'Track by identity, or keep the changing fields in signals; use unique keys.', it: 'Traccia per identità, o tieni in signal i campi che cambiano; usa chiavi uniche.' },
    page: 'templates/for'
  },
  {
    area: 'Runtime',
    kind: 'bug',
    title: { en: '@switch evaluates its expression once per case', it: '@switch valuta la sua espressione una volta per case' },
    details: {
      en: 'The expression runs again for each @case until one matches: side effects and costly calls are repeated.',
      it: 'L’espressione viene rieseguita per ogni @case finché uno corrisponde: effetti collaterali e chiamate costose si ripetono.'
    },
    workaround: { en: 'Switch over a signal or a computed signal.', it: 'Fai lo switch su un signal o su un computed.' },
    page: 'templates/switch'
  },
  {
    area: 'Runtime',
    kind: 'bug',
    title: { en: 'A query created after the connection', it: 'Una query creata dopo la connessione' },
    details: {
      en: 'query() called after the component is connected stays null until the next connection, and the next disconnection throws TypeError: stop is not a function, skipping the other hooks.',
      it: 'query() chiamata dopo la connessione del componente resta null fino alla connessione successiva, e la disconnessione seguente lancia TypeError: stop is not a function, saltando gli altri hook.'
    },
    workaround: { en: 'Create queries in field initializers.', it: 'Crea le query negli inizializzatori dei campi.' },
    page: 'components/queries'
  },
  {
    area: 'Runtime',
    kind: 'bug',
    title: { en: 'An effect created in the constructor dies at the first disconnection', it: 'Un effect creato nel costruttore muore alla prima disconnessione' },
    details: {
      en: 'Effects created in field initializers or in the constructor are disposed when the component is disconnected, and never created again.',
      it: 'Gli effect creati negli inizializzatori dei campi o nel costruttore vengono eliminati alla disconnessione del componente, e mai ricreati.'
    },
    workaround: { en: 'Create effects in onInit or afterRender.', it: 'Crea gli effect in onInit o afterRender.' },
    page: 'components/lifecycle'
  },
  {
    area: 'Runtime',
    kind: 'bug',
    title: { en: 'A detail with option keys is taken for options', it: 'Un detail con chiavi di opzioni viene preso per le opzioni' },
    details: {
      en: 'emit({ bubbles: true, value: 1 }) dispatches an event with a null detail, and bubbles set to true.',
      it: 'emit({ bubbles: true, value: 1 }) emette un evento con detail null, e bubbles a true.'
    },
    workaround: { en: 'Wrap the detail in another object.', it: 'Avvolgi il detail in un altro oggetto.' },
    page: 'components/outputs'
  },
  {
    area: 'Runtime',
    kind: 'bug',
    title: { en: 'input() deletes the transform of its options', it: 'input() cancella il transform dalle sue opzioni' },
    details: {
      en: 'The options object passed to input() loses its transform: reused for a second input, it applies none. @Property is not affected, since it builds a new object each time.',
      it: 'L’oggetto di opzioni passato a input() perde il suo transform: riusato per un secondo input, non ne applica nessuno. @Property non è colpito, perché costruisce ogni volta un oggetto nuovo.'
    },
    workaround: { en: 'Pass a new options object to each call.', it: 'Passa un nuovo oggetto di opzioni a ogni chiamata.' },
    page: 'components/inputs'
  },
  {
    area: 'Signals',
    kind: 'bug',
    title: { en: 'untracked does not survive a computed evaluated inside it', it: 'untracked non sopravvive a un computed valutato al suo interno' },
    details: {
      en: 'After a computed signal is evaluated inside untracked, the following reads are tracked again by the outer effect.',
      it: 'Dopo che un computed viene valutato dentro untracked, le letture successive vengono di nuovo tracciate dall’effect esterno.'
    },
    workaround: { en: 'Use one untracked per read.', it: 'Usa un untracked per ogni lettura.' },
    page: 'signals/untracked'
  },
  {
    area: 'Signals',
    kind: 'bug',
    title: { en: 'An unwatched computed signal is evaluated at every read', it: 'Un computed non osservato viene valutato a ogni lettura' },
    details: {
      en: 'Without an effect or a watcher depending on it, the cache of a computed signal is not used.',
      it: 'Senza un effect o un watcher che ne dipenda, la cache di un computed non viene usata.'
    },
    workaround: { en: 'Read costly computed signals from effects or templates.', it: 'Leggi i computed costosi da effect o template.' },
    page: 'signals/computed'
  },
  {
    area: 'Signals',
    kind: 'bug',
    title: { en: 'watched and unwatched fire on every run of the only dependent', it: 'watched e unwatched scattano a ogni esecuzione dell’unico dipendente' },
    details: {
      en: 'The sinks are removed before each recomputation, so a signal with one dependent is unwatched and watched again every time it runs. computed() ignores both callbacks.',
      it: 'I sink vengono rimossi prima di ogni ricalcolo, quindi un signal con un solo dipendente viene unwatched e watched di nuovo a ogni esecuzione. computed() ignora entrambe le callback.'
    },
    workaround: { en: 'Make the callbacks idempotent; use Signal.Computed for computed ones.', it: 'Rendi idempotenti le callback; usa Signal.Computed per quelli derivati.' },
    page: 'signals/options'
  },
  {
    area: 'Signals',
    kind: 'bug',
    title: { en: 'signal() and computed() are not instances of the proposal classes', it: 'signal() e computed() non sono istanze delle classi della proposta' },
    details: {
      en: 'They return wrapper functions: instanceof Signal.State is false, and Signal.subtle.introspectSinks throws signal.getSinks is not a function.',
      it: 'Restituiscono funzioni wrapper: instanceof Signal.State è false, e Signal.subtle.introspectSinks lancia signal.getSinks is not a function.'
    },
    workaround: { en: 'Use Signal.State and Signal.Computed for introspection.', it: 'Usa Signal.State e Signal.Computed per l’introspezione.' },
    page: 'signals/advanced'
  },
  {
    area: 'Build',
    kind: 'bug',
    title: { en: 'Template errors do not fail the build', it: 'Gli errori dei template non fanno fallire la build' },
    details: {
      en: 'xd build exits with 0, and the component reaches the bundle without a render function.',
      it: 'xd build esce con 0, e il componente arriva nel bundle senza funzione di render.'
    },
    workaround: { en: 'Fail the pipeline on the Xaendar: messages.', it: 'Fai fallire la pipeline sui messaggi Xaendar:.' },
    page: 'tools/build'
  },
  {
    area: 'Build',
    kind: 'limitation',
    title: { en: 'Classes are not type-checked', it: 'Le classi non passano il type check' },
    details: {
      en: 'Only templates are checked: members clashing with HTMLElement, such as title, lang, remove or matches, go unnoticed.',
      it: 'Vengono controllati solo i template: membri in conflitto con HTMLElement, come title, lang, remove o matches, passano inosservati.'
    },
    workaround: { en: 'Run tsc --noEmit too.', it: 'Esegui anche tsc --noEmit.' },
    page: 'tools/build'
  },
  {
    area: 'Build',
    kind: 'bug',
    title: { en: 'The dev server keeps stale metadata', it: 'Il dev server conserva metadati vecchi' },
    details: {
      en: 'After changing the type of an input or output, the templates using it are still checked against the old one, and a page created before its template stays without a render function, until the server restarts.',
      it: 'Dopo aver cambiato il tipo di un input o di un output, i template che lo usano vengono ancora controllati con quello vecchio, e una pagina creata prima del suo template resta senza funzione di render, finché il server non viene riavviato.'
    },
    workaround: { en: 'Restart xd start.', it: 'Riavvia xd start.' },
    page: 'tools/build'
  },
  {
    area: 'Build',
    kind: 'bug',
    title: { en: 'The dev overlay reports handled errors', it: 'L’overlay di sviluppo segnala errori gestiti' },
    details: {
      en: 'Vite prints [Unhandled error] even for errors handled with preventDefault on window.',
      it: 'Vite stampa [Unhandled error] anche per errori gestiti con preventDefault su window.'
    },
    workaround: { en: 'None: it happens in development only.', it: 'Nessuno: accade solo in sviluppo.' },
    page: 'signals/effects'
  },
  {
    area: 'CLI',
    kind: 'bug',
    title: { en: 'xd generate does not exist', it: 'xd generate non esiste' },
    details: {
      en: 'The component command is registered at the top level instead of inside generate.',
      it: 'Il comando dei componenti è registrato al livello principale invece che dentro generate.'
    },
    workaround: { en: 'Run xd component, or xd c.', it: 'Esegui xd component, o xd c.' },
    page: 'tools/cli'
  },
  {
    area: 'CLI',
    kind: 'bug',
    title: { en: 'Style options the plugin cannot compile', it: 'Opzioni di stile che il plugin non sa compilare' },
    details: {
      en: 'xd new accepts scss, less and styl, which the plugin rejects; xd component ignores xaendar.json and always writes CSS.',
      it: 'xd new accetta scss, less e styl, che il plugin rifiuta; xd component ignora xaendar.json e scrive sempre CSS.'
    },
    workaround: { en: 'Use css.', it: 'Usa css.' },
    page: 'tools/cli'
  },
  {
    area: 'CLI',
    kind: 'bug',
    title: { en: 'The project name is checked too late', it: 'Il nome del progetto viene controllato troppo tardi' },
    details: {
      en: 'xd new MyApp writes most of the project before rejecting MyApp-root, and never installs the dependencies.',
      it: 'xd new MyApp scrive gran parte del progetto prima di rifiutare MyApp-root, e non installa mai le dipendenze.'
    },
    workaround: { en: 'Use a lowercase name with a dash, and delete the half-made folder.', it: 'Usa un nome minuscolo con un trattino, e cancella la cartella incompleta.' },
    page: 'tools/cli'
  },
  {
    area: 'CLI',
    kind: 'bug',
    title: { en: 'The generated spec does not run', it: 'La spec generata non parte' },
    details: {
      en: 'npm test runs Vitest without the decorators transform: SyntaxError: Invalid or unexpected token.',
      it: 'npm test esegue Vitest senza la trasformazione dei decoratori: SyntaxError: Invalid or unexpected token.'
    },
    workaround: { en: 'Configure Vitest with the same plugins and a DOM environment.', it: 'Configura Vitest con gli stessi plugin e un ambiente DOM.' },
    page: 'tools/cli'
  },
  {
    area: 'CLI',
    kind: 'bug',
    title: { en: 'The published packages predate this documentation', it: 'I pacchetti pubblicati precedono questa documentazione' },
    details: {
      en: 'The 0.12.0 packages on npm export BaseWebComponent, not CustomElement: a project generated by a CLI built from the repository fails with MISSING_EXPORT.',
      it: 'I pacchetti 0.12.0 su npm esportano BaseWebComponent, non CustomElement: un progetto generato da una CLI compilata dal repository fallisce con MISSING_EXPORT.'
    },
    workaround: { en: 'Work inside the repository until the next release.', it: 'Lavora dentro il repository fino al prossimo rilascio.' },
    page: 'tools/cli'
  },
  {
    area: 'Editor',
    kind: 'bug',
    title: { en: 'The language server never compiles a template', it: 'Il language server non compila mai un template' },
    details: {
      en: 'The index mapping templates to components is never filled, so diagnostics and completions are never produced. Hover is announced but not implemented.',
      it: 'L’indice che associa i template ai componenti non viene mai riempito, quindi diagnostica e completamenti non vengono mai prodotti. L’hover è dichiarato ma non implementato.'
    },
    workaround: { en: 'Read the errors in the terminal of xd start.', it: 'Leggi gli errori nel terminale di xd start.' },
    page: 'tools/language-service'
  },
  {
    area: 'Editor',
    kind: 'bug',
    title: { en: 'The grammar highlights {{ }} instead of { }', it: 'La grammatica evidenzia {{ }} invece di { }' },
    details: {
      en: 'Interpolations and directives keep the colors of plain HTML.',
      it: 'Interpolazioni e direttive mantengono i colori dell’HTML semplice.'
    },
    workaround: { en: 'None yet.', it: 'Nessuno per ora.' },
    page: 'tools/language-service'
  },
  {
    area: 'Docs',
    kind: 'docs',
    title: { en: 'Documentation inside the packages is out of date', it: 'La documentazione dentro i pacchetti non è aggiornata' },
    details: {
      en: 'The README of core mentions attributeChangedCallback, InputSignal<a, b> and .get(); the README of signals imports effect from @xaendar/signals and says that two synchronous sets run an effect twice; the JSDoc of onCleanup says it runs before each re-run; the JSDoc of signal() defaults to any; QuerySlotOptions mentions slot; the @for alias is documented as $index = i.',
      it: 'Il README di core cita attributeChangedCallback, InputSignal<a, b> e .get(); il README di signals importa effect da @xaendar/signals e dice che due set sincroni eseguono un effect due volte; il JSDoc di onCleanup dice che viene eseguito prima di ogni riesecuzione; il JSDoc di signal() usa any come default; QuerySlotOptions cita slot; l’alias di @for è documentato come $index = i.'
    },
    workaround: { en: 'Trust this site: every behavior here was observed.', it: 'Fidati di questo sito: ogni comportamento descritto qui è stato osservato.' },
    page: 'signals/effects'
  }
];
