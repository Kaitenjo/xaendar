import type { Messages } from '../../../core/i18n/i18n';

/**
 * The kinds of exported symbols.
 */
export type ApiKind = 'decorator' | 'class' | 'function' | 'type' | 'global';

/**
 * An exported symbol, or a group of internal ones.
 */
export type ApiEntry = {
  /**
   * The name, as imported. It is also the key of its description in the `api` texts.
   */
  readonly name: keyof Messages['api'];
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
    page: 'components/anatomy'
  },
  {
    name: 'Property',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: '@Property(defaultValue, { alias?, transform?, equals? }) accessor name!: InputSignal<T>',
    page: 'components/inputs'
  },
  {
    name: 'Property.required',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: '@Property.required({ alias?, transform?, equals? }) accessor name!: InputSignal<T>',
    page: 'components/inputs'
  },
  {
    name: 'Event',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: '@Event({ bubbles?, cancelable?, composed? }) accessor name!: Output<T>',
    page: 'components/outputs'
  },
  {
    name: 'Query',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Query('.selector' | ComponentClass) accessor name!: QuerySignal<E | null>",
    page: 'components/queries'
  },
  {
    name: 'Query.all',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Query.all('.selector' | ComponentClass) accessor name!: QuerySignal<E[]>",
    page: 'components/queries'
  },
  {
    name: 'Query.content',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Query.content('.selector' | ComponentClass, { slots?, lightDom? }) accessor name!: QuerySignal<E | null>",
    page: 'components/content-queries'
  },
  {
    name: 'Query.content.all',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Query.content.all('.selector' | ComponentClass, { slots?, lightDom? }) accessor name!: QuerySignal<E[]>",
    page: 'components/content-queries'
  },
  {
    name: 'Directive',
    module: '@xaendar/core',
    kind: 'decorator',
    signature: "@Directive({ selector: 'exName' })",
    page: 'directives/overview'
  },
  {
    name: 'CustomElement',
    module: '@xaendar/core',
    kind: 'class',
    signature: 'class X extends CustomElement { onInit?(); afterRender?(); onDestroy?(); effect(fn, options?) }',
    page: 'components/lifecycle'
  },
  {
    name: 'CustomDirective',
    module: '@xaendar/core',
    kind: 'class',
    signature: 'class X extends CustomDirective<E> { element: E; onInit?(); onDestroy?(); effect(fn, options?) }',
    page: 'directives/custom'
  },
  {
    name: 'StructuralDirective',
    module: '@xaendar/core',
    kind: 'class',
    signature: 'class X extends StructuralDirective { shouldRender(): boolean | Promise<boolean> }',
    page: 'directives/structural'
  },
  {
    name: 'query',
    module: '@xaendar/core',
    kind: 'function',
    signature: "query(this, '.selector' | ComponentClass): QuerySignal<E | null>",
    page: 'components/queries'
  },
  {
    name: 'queryAll',
    module: '@xaendar/core',
    kind: 'function',
    signature: "queryAll(this, '.selector' | ComponentClass): QuerySignal<E[]>",
    page: 'components/queries'
  },
  {
    name: 'querySlot',
    module: '@xaendar/core',
    kind: 'function',
    signature: "querySlot(this, '.selector' | ComponentClass, { slots?, lightDom? }): QuerySignal<E | null>",
    page: 'components/content-queries'
  },
  {
    name: 'querySlotAll',
    module: '@xaendar/core',
    kind: 'function',
    signature: "querySlotAll(this, '.selector' | ComponentClass, { slots?, lightDom? }): QuerySignal<E[]>",
    page: 'components/content-queries'
  },
  {
    name: 'Output',
    module: '@xaendar/core',
    kind: 'type',
    signature: 'Output<T = void> = { emit(detail?: T, options?: EventOptions): void }',
    page: 'components/outputs'
  },
  {
    name: 'EventOptions',
    module: '@xaendar/core',
    kind: 'type',
    signature: '{ bubbles?: boolean; cancelable?: boolean; composed?: boolean }',
    page: 'components/outputs'
  },
  {
    name: 'WebComponentOptions',
    module: '@xaendar/core',
    kind: 'type',
    signature: '{ selector: string; templateUrl: string; styleUrl?: string }',
    page: 'components/anatomy'
  },
  {
    name: 'DirectiveOptions',
    module: '@xaendar/core',
    kind: 'type',
    signature: '{ selector: string }',
    page: 'directives/overview'
  },
  {
    name: '_Context, _if, _for, _switch, _renderElement, _renderText, _defineRender, mountNode, createAnchor, RenderFunction, RenderDefinition, …',
    module: '@xaendar/core',
    kind: 'function',
    signature: '—',
    page: 'tools/build',
    internal: true
  },
  {
    name: 'signal',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'signal<T>(value: T, { equals? }?): Signal<T>',
    page: 'signals/overview'
  },
  {
    name: 'computed',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'computed<T>(fn: () => T, { equals? }?): Computed<T>',
    page: 'signals/computed'
  },
  {
    name: 'effect',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'effect(fn: () => void, { onBeforeRun?, onAfterRun?, onCleanup? }?): () => void',
    page: 'signals/effects'
  },
  {
    name: 'untracked',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'untracked<T>(fn: () => T): T',
    page: 'signals/untracked'
  },
  {
    name: 'input',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: 'input<T, In = T>(value?: T, { transform?, equals? }?): InputSignal<T>',
    page: 'components/inputs'
  },
  {
    name: 'Signal',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'Signal<T> = Signal.State<T> & { (): T; update(fn: (prev: T) => T): void }',
    page: 'signals/shared-state'
  },
  {
    name: 'Computed',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'Computed<T> = Signal.Computed<T> & { (): T }',
    page: 'signals/computed'
  },
  {
    name: 'InputSignal',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'InputSignal<T> = { (): T; get(): T }',
    page: 'components/inputs'
  },
  {
    name: 'QuerySignal',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'QuerySignal<T> = { (): T; get(): T }',
    page: 'components/queries'
  },
  {
    name: 'EffectOptions',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: '{ onBeforeRun?: () => void; onAfterRun?: () => void; onCleanup?: () => void }',
    page: 'signals/effects'
  },
  {
    name: 'InputSignalOptions',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'SignalOptions<T> & { transform?: (value: In) => T }',
    page: 'components/inputs'
  },
  {
    name: 'QueryTarget, QueryElement, QuerySlotOptions',
    module: '@xaendar/core/signals',
    kind: 'type',
    signature: 'QueryTarget = string | Constructor<HTMLElement>; QuerySlotOptions = { slots?: string | string[]; lightDom?: false } | { lightDom: true }',
    page: 'components/content-queries'
  },
  {
    name: 'createQuerySignal, createSlotQuerySignal, toSelector',
    module: '@xaendar/core/signals',
    kind: 'function',
    signature: '—',
    page: 'components/queries',
    internal: true
  },
  {
    name: 'loadSignals',
    module: '@xaendar/signals',
    kind: 'function',
    signature: 'loadSignals({ devMode?: boolean }?): void',
    page: 'installation'
  },
  {
    name: 'SignalOptions',
    module: '@xaendar/signals',
    kind: 'type',
    signature: '{ equals?: SignalEqual<T>; [Signal.subtle.watched]?: () => void; [Signal.subtle.unwatched]?: () => void }',
    page: 'signals/options'
  },
  {
    name: 'SignalEqual, ExtractSignalType',
    module: '@xaendar/signals',
    kind: 'type',
    signature: 'SignalEqual<T> = (a, b) => boolean; ExtractSignalType<Signal.State<T>> = T',
    page: 'signals/options'
  },
  {
    name: 'Signal.State, Signal.Computed',
    module: '@xaendar/signals',
    kind: 'global',
    signature: 'new Signal.State(value, options?); new Signal.Computed(fn, options?)',
    page: 'signals/advanced'
  },
  {
    name: 'Signal.subtle',
    module: '@xaendar/signals',
    kind: 'global',
    signature: 'Watcher, untrack, currentComputed, introspectSources, introspectSinks, hasSources, hasSinks, watched, unwatched',
    page: 'signals/advanced'
  }
];
