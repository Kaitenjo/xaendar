import type { Localized } from '../../../core/router/route-hash.utils';

/**
 * The kinds of exported symbols.
 */
export type ApiKind = 'decorator' | 'class' | 'function' | 'type' | 'global';

/**
 * An exported symbol, or a group of internal ones.
 */
export type ApiEntry = {
  /**
   * The name, as imported.
   */
  readonly name: string;
  /**
   * The module exporting it.
   */
  readonly module: '@xaendar/core' | '@xaendar/core/signals' | '@xaendar/signals';
  /**
   * The kind of symbol.
   */
  readonly kind: ApiKind;
  /**
   * How it is used.
   */
  readonly signature: string;
  /**
   * What it does.
   */
  readonly description: Localized;
  /**
   * The path of the page documenting it.
   */
  readonly page: string;
  /**
   * Whether it is meant for the compiled templates only.
   */
  readonly internal?: boolean;
};

/**
 * Every export of the public entry points of the packages used by applications.
 */
export const API: readonly ApiEntry[] = [
  {
    name: 'WebComponent',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@WebComponent({ selector: 'x-y', templateUrl: './x.xd.component.html', styleUrl?: './x.css' })",
    description: {
      en: 'Defines a class extending CustomElement as a custom element, with its compiled template and its stylesheet. The options must be string literals.',
      it: 'Definisce una classe che estende CustomElement come custom element, con il suo template compilato e il suo foglio di stile. Le opzioni devono essere stringhe letterali.'
    },
    page: 'components/anatomy'
  },
  {
    name: 'Property',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: '@Property(defaultValue, { alias?, transform?, equals? }) accessor name!: InputSignal<T>',
    description: {
      en: 'Declares an input. The accessor holds an InputSignal, set by the bindings of the parent template.',
      it: 'Dichiara un input. L’accessor contiene un InputSignal, impostato dai binding del template padre.'
    },
    page: 'components/inputs'
  },
  {
    name: 'Property.required',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: '@Property.required({ alias?, transform?, equals? }) accessor name!: InputSignal<T>',
    description: {
      en: 'Declares an input that every use of the component must bind, in every branch of a conditional binding. Checked at compile time.',
      it: 'Dichiara un input che ogni uso del componente deve legare, in ogni ramo di un binding condizionale. Controllato in compilazione.'
    },
    page: 'components/inputs'
  },
  {
    name: 'Event',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: '@Event({ bubbles?, cancelable?, composed? }) accessor name!: Output<T>',
    description: {
      en: 'Declares an output. emit(detail?, options?) dispatches a CustomEvent named after the accessor on the host element.',
      it: 'Dichiara un output. emit(detail?, options?) emette sull’elemento host un CustomEvent con il nome dell’accessor.'
    },
    page: 'components/outputs'
  },
  {
    name: 'Query',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Query('.selector' | ComponentClass) accessor name!: QuerySignal<E | null>",
    description: {
      en: 'The first element of the shadow root matching a selector or a component class, kept up to date as a signal.',
      it: 'Il primo elemento della shadow root che corrisponde a un selettore o a una classe componente, tenuto aggiornato come signal.'
    },
    page: 'components/queries'
  },
  {
    name: 'Query.all',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Query.all('.selector' | ComponentClass) accessor name!: QuerySignal<E[]>",
    description: {
      en: 'Every element of the shadow root matching a selector or a component class.',
      it: 'Tutti gli elementi della shadow root che corrispondono a un selettore o a una classe componente.'
    },
    page: 'components/queries'
  },
  {
    name: 'Query.content',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Query.content('.selector' | ComponentClass, { slots?, lightDom? }) accessor name!: QuerySignal<E | null>",
    description: {
      en: 'The first element projected into the slots of the component that matches a selector or a component class.',
      it: 'Il primo elemento proiettato negli slot del componente che corrisponde a un selettore o a una classe componente.'
    },
    page: 'components/content-queries'
  },
  {
    name: 'Query.content.all',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Query.content.all('.selector' | ComponentClass, { slots?, lightDom? }) accessor name!: QuerySignal<E[]>",
    description: {
      en: 'Every projected element matching a selector or a component class, in the order of the slots.',
      it: 'Tutti gli elementi proiettati che corrispondono a un selettore o a una classe componente, nell’ordine degli slot.'
    },
    page: 'components/content-queries'
  },
  {
    name: 'Directive',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Directive({ selector: 'exName' })",
    description: {
      en: 'Registers a class extending CustomDirective or StructuralDirective under a selector, used as @@selector or *selector.',
      it: 'Registra una classe che estende CustomDirective o StructuralDirective con un selettore, usato come @@selettore o *selettore.'
    },
    page: 'directives/overview'
  },
  {
    name: 'CustomElement',
    module: '@xaendar/core',
    kind: 'class',
    signature: 'class X extends CustomElement { onInit?(); afterRender?(); onDestroy?(); effect(fn, options?) }',
    description: {
      en: 'Base class of components: an open shadow root, the lifecycle hooks, and effects disposed at disconnection.',
      it: 'Classe base dei componenti: una shadow root aperta, gli hook del ciclo di vita, e effect eliminati alla disconnessione.'
    },
    page: 'components/lifecycle'
  },
  {
    name: 'CustomDirective',
    module: '@xaendar/core',
    kind: 'class',
    signature: 'class X extends CustomDirective<E> { element: E; onInit?(); onDestroy?(); effect(fn, options?) }',
    description: {
      en: 'Base class of the directives acting on the element they are applied to.',
      it: 'Classe base delle direttive che agiscono sull’elemento a cui sono applicate.'
    },
    page: 'directives/custom'
  },
  {
    name: 'StructuralDirective',
    module: '@xaendar/core',
    kind: 'class',
    signature: 'class X extends StructuralDirective { shouldRender(): boolean | Promise<boolean> }',
    description: {
      en: 'Base class of the directives deciding whether the element they are applied to is rendered.',
      it: 'Classe base delle direttive che decidono se l’elemento a cui sono applicate viene renderizzato.'
    },
    page: 'directives/structural'
  },
  {
    name: 'query',
    module: '@xaendar/core',
    kind: 'function',
    signature: "query(this, '.selector' | ComponentClass): QuerySignal<E | null>",
    description: {
      en: 'The function form of @Query, for a field initializer. It must be created before the component is connected.',
      it: 'La forma funzione di @Query, per l’inizializzatore di un campo. Va creata prima che il componente sia connesso.'
    },
    page: 'components/queries'
  },
  {
    name: 'queryAll',
    module: '@xaendar/core',
    kind: 'function',
    signature: "queryAll(this, '.selector' | ComponentClass): QuerySignal<E[]>",
    description: {
      en: 'The function form of @Query.all.',
      it: 'La forma funzione di @Query.all.'
    },
    page: 'components/queries'
  },
  {
    name: 'querySlot',
    module: '@xaendar/core',
    kind: 'function',
    signature: "querySlot(this, '.selector' | ComponentClass, { slots?, lightDom? }): QuerySignal<E | null>",
    description: {
      en: 'The function form of @Query.content.',
      it: 'La forma funzione di @Query.content.'
    },
    page: 'components/content-queries'
  },
  {
    name: 'querySlotAll',
    module: '@xaendar/core',
    kind: 'function',
    signature: "querySlotAll(this, '.selector' | ComponentClass, { slots?, lightDom? }): QuerySignal<E[]>",
    description: {
      en: 'The function form of @Query.content.all.',
      it: 'La forma funzione di @Query.content.all.'
    },
    page: 'components/content-queries'
  },
  {
    name: 'Output',
    module: '@xaendar/core',
    kind: 'type',
    signature: 'Output<T = void> = { emit(detail?: T, options?: EventOptions): void }',
    description: {
      en: 'The type of an @Event accessor. Without a type argument the event carries no detail, and templates cannot read $event.',
      it: 'Il tipo di un accessor @Event. Senza argomento di tipo l’evento non porta un detail, e i template non possono leggere $event.'
    },
    page: 'components/outputs'
  },
  {
    name: 'EventOptions',
    module: '@xaendar/core',
    kind: 'type',
    signature: '{ bubbles?: boolean; cancelable?: boolean; composed?: boolean }',
    description: {
      en: 'The options of an output, given to @Event or to a single emit. At least one key is required.',
      it: 'Le opzioni di un output, passate a @Event o a un singolo emit. Serve almeno una chiave.'
    },
    page: 'components/outputs'
  },
  {
    name: 'WebComponentOptions',
    module: '@xaendar/core',
    kind: 'type',
    signature: '{ selector: string; templateUrl: string; styleUrl?: string }',
    description: {
      en: 'The options of @WebComponent.',
      it: 'Le opzioni di @WebComponent.'
    },
    page: 'components/anatomy'
  },
  {
    name: 'DirectiveOptions',
    module: '@xaendar/core',
    kind: 'type',
    signature: '{ selector: string }',
    description: {
      en: 'The options of @Directive.',
      it: 'Le opzioni di @Directive.'
    },
    page: 'directives/overview'
  },
  {
    name: '_Context, _if, _for, _switch, _renderElement, _renderText, _defineRender, mountNode, createAnchor, RenderFunction, RenderDefinition, …',
    module: '@xaendar/core',
    kind: 'function',
    signature: '—',
    description: {
      en: 'The runtime of the compiled templates, and its types (BindingHost, RenderElementAttribute, …). They are exported for the generated code, not for applications.',
      it: 'Il runtime dei template compilati, con i suoi tipi (BindingHost, RenderElementAttribute, …). Sono esportati per il codice generato, non per le applicazioni.'
    },
    page: 'tools/build',
    internal: true
  },
  {
    name: 'signal',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'signal<T>(value: T, { equals? }?): Signal<T>',
    description: {
      en: 'A writable signal: read it by calling it, write it with set or update.',
      it: 'Un signal scrivibile: si legge chiamandolo, si scrive con set o update.'
    },
    page: 'signals/overview'
  },
  {
    name: 'computed',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'computed<T>(fn: () => T, { equals? }?): Computed<T>',
    description: {
      en: 'A signal derived from others, evaluated lazily and cached until a dependency changes.',
      it: 'Un signal derivato da altri, valutato in modo lazy e tenuto in cache finché non cambia una dipendenza.'
    },
    page: 'signals/computed'
  },
  {
    name: 'effect',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'effect(fn: () => void, { onBeforeRun?, onAfterRun?, onCleanup? }?): () => void',
    description: {
      en: 'Runs a function now, and again in a microtask after the signals it read change. Returns the function disposing it.',
      it: 'Esegue una funzione subito, e di nuovo in un microtask dopo che cambiano i signal letti. Restituisce la funzione che lo elimina.'
    },
    page: 'signals/effects'
  },
  {
    name: 'untracked',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'untracked<T>(fn: () => T): T',
    description: {
      en: 'Runs a function without tracking the signals it reads.',
      it: 'Esegue una funzione senza tracciare i signal che legge.'
    },
    page: 'signals/untracked'
  },
  {
    name: 'input',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'input<T, In = T>(value?: T, { transform?, equals? }?): InputSignal<T>',
    description: {
      en: 'Creates the InputSignal held by a @Property accessor. Applications use the decorator instead.',
      it: 'Crea l’InputSignal contenuto da un accessor @Property. Le applicazioni usano invece il decoratore.'
    },
    page: 'components/inputs'
  },
  {
    name: 'Signal',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'Signal<T> = Signal.State<T> & { (): T; update(fn: (prev: T) => T): void }',
    description: {
      en: 'The type returned by signal(). Annotating a member with it makes the attributes reading the member reactive.',
      it: 'Il tipo restituito da signal(). Annotare un membro con questo tipo rende reattivi gli attributi che lo leggono.'
    },
    page: 'signals/shared-state'
  },
  {
    name: 'Computed',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'Computed<T> = Signal.Computed<T> & { (): T }',
    description: {
      en: 'The type returned by computed().',
      it: 'Il tipo restituito da computed().'
    },
    page: 'signals/computed'
  },
  {
    name: 'InputSignal',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'InputSignal<T> = { (): T; get(): T }',
    description: {
      en: 'The type of an input: read-only for the component, set by the bindings of the parent.',
      it: 'Il tipo di un input: in sola lettura per il componente, impostato dai binding del padre.'
    },
    page: 'components/inputs'
  },
  {
    name: 'QuerySignal',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'QuerySignal<T> = { (): T; get(): T }',
    description: {
      en: 'The type of a query: a read-only signal updated a microtask after the DOM changes.',
      it: 'Il tipo di una query: un signal in sola lettura aggiornato un microtask dopo i cambi del DOM.'
    },
    page: 'components/queries'
  },
  {
    name: 'EffectOptions',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: '{ onBeforeRun?: () => void; onAfterRun?: () => void; onCleanup?: () => void }',
    description: {
      en: 'Hooks of an effect. onCleanup runs once, when the effect is disposed.',
      it: 'Hook di un effect. onCleanup viene eseguito una volta, quando l’effect viene eliminato.'
    },
    page: 'signals/effects'
  },
  {
    name: 'InputSignalOptions',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'SignalOptions<T> & { transform?: (value: In) => T }',
    description: {
      en: 'The options of input(), and of @Property together with alias.',
      it: 'Le opzioni di input(), e di @Property insieme ad alias.'
    },
    page: 'components/inputs'
  },
  {
    name: 'QueryTarget, QueryElement, QuerySlotOptions',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'QueryTarget = string | Constructor<HTMLElement>; QuerySlotOptions = { slots?: string | string[]; lightDom?: false } | { lightDom: true }',
    description: {
      en: 'The target of a query, the element type it resolves to, and the options of the content queries.',
      it: 'Il bersaglio di una query, il tipo di elemento che ne risulta, e le opzioni delle query sul contenuto.'
    },
    page: 'components/content-queries'
  },
  {
    name: 'createQuerySignal, createSlotQuerySignal, toSelector',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: '—',
    description: {
      en: 'Used by the query decorators and functions to build their signals.',
      it: 'Usate dai decoratori e dalle funzioni delle query per costruire i loro signal.'
    },
    page: 'components/queries',
    internal: true
  },
  {
    name: 'loadSignals',
    module: '@xaendar/signals',
    kind: 'function',
    signature: 'loadSignals({ devMode?: boolean }?): void',
    description: {
      en: 'Installs the global Signal polyfill. It must run before @xaendar/core is loaded, from a module of its own.',
      it: 'Installa il polyfill globale Signal. Va eseguito prima che @xaendar/core venga caricato, da un modulo a sé.'
    },
    page: 'installation'
  },
  {
    name: 'SignalOptions',
    module: '@xaendar/signals',
    kind: 'type',
    signature: '{ equals?: SignalEqual<T>; [Signal.subtle.watched]?: () => void; [Signal.subtle.unwatched]?: () => void }',
    description: {
      en: 'The options of signal() and of Signal.State. computed() only uses equals.',
      it: 'Le opzioni di signal() e di Signal.State. computed() usa solo equals.'
    },
    page: 'signals/options'
  },
  {
    name: 'SignalEqual, ExtractSignalType',
    module: '@xaendar/signals',
    kind: 'type',
    signature: 'SignalEqual<T> = (a, b) => boolean; ExtractSignalType<Signal.State<T>> = T',
    description: {
      en: 'The type of an equality function, and the type of the value of a signal.',
      it: 'Il tipo di una funzione di uguaglianza, e il tipo del valore di un signal.'
    },
    page: 'signals/options'
  },
  {
    name: 'Signal.State, Signal.Computed',
    module: '@xaendar/signals',
    kind: 'global',
    signature: 'new Signal.State(value, options?); new Signal.Computed(fn, options?)',
    description: {
      en: 'The classes of the TC39 proposal, installed globally by loadSignals. signal() and computed() wrap them.',
      it: 'Le classi della proposta TC39, installate globalmente da loadSignals. signal() e computed() le avvolgono.'
    },
    page: 'signals/advanced'
  },
  {
    name: 'Signal.subtle',
    module: '@xaendar/signals',
    kind: 'global',
    signature: 'Watcher, untrack, currentComputed, introspectSources, introspectSinks, hasSources, hasSinks, watched, unwatched',
    description: {
      en: 'The low-level API of the proposal: watchers, introspection, and the symbols of the watched and unwatched callbacks.',
      it: 'L’API di basso livello della proposta: watcher, introspezione, e i simboli delle callback watched e unwatched.'
    },
    page: 'signals/advanced'
  }
];
