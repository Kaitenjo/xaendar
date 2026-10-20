import type { ApiPackage } from '../api.data';

/**
 * The symbols of `@xaendar/core`.
 */
export const CORE_API: ApiPackage = {
  name: '@xaendar/core',
  symbols: [
    {
      name: 'WebComponent',
      kind: 'decorator',
      signature: 'function WebComponent<T extends CustomElement>(options: WebComponentOptions): ClassDecorator<T>',
      members: [
        {
          name: 'selector',
          group: 'options',
          signature: 'selector: string',
          snippets: ['components/invalid-selector-error.txt']
        },
        {
          name: 'templateUrl',
          group: 'options',
          signature: 'templateUrl: string',
          snippets: ['components/missing-template-error.txt']
        },
        {
          name: 'styleUrl',
          group: 'options',
          signature: 'styleUrl?: string',
          snippets: ['components/css-limits.css']
        },
        {
          name: 'hostDirectives',
          group: 'options',
          signature: 'hostDirectives?: Array<Constructor<CustomDirective> | HostDirectiveOptions>',
          snippets: ['directives/host-directive.ts']
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['components/web-component-options.ts'] },
        { key: 'literals', snippets: ['components/non-literal-options.ts', 'components/non-literal-options-error.txt'] },
        { key: 'registration', snippets: ['components/duplicate-selector-error.txt'] }
      ],
      guides: ['components/anatomy', 'components/registration', 'components/styling', 'directives/custom']
    },
    {
      name: 'Directive',
      kind: 'decorator',
      signature: 'function Directive<T extends CustomDirective | StructuralDirective>(options: DirectiveOptions): ClassDecorator<T>',
      members: [
        {
          name: 'selector',
          group: 'options',
          signature: 'selector: string',
          snippets: ['directives/duplicate-selector-error.txt']
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['api/core/directive-kinds.ts', 'directives/directive-syntax.html'] },
        { key: 'importing', snippets: ['directives/directive-registration.ts', 'directives/not-imported-error.txt'] },
        { key: 'prefix', snippets: ['directives/wrong-kind-error.txt', 'directives/missing-registration-error.txt'] }
      ],
      guides: ['directives/overview', 'directives/custom', 'directives/structural']
    },
    {
      name: 'Property',
      kind: 'decorator',
      signature: 'function Property<Value extends InputSignal<ActualValue>, ActualValue = Value extends InputSignal<infer Type> ? Type : unknown, IncomingValue = ActualValue>(value?: ActualValue, options?: InputSignalOptions<ActualValue, IncomingValue> & { alias?: string }): AccessorDecorator<CustomElement | CustomDirective | StructuralDirective, InputSignal<ActualValue>>',
      members: [
        {
          name: 'Property.required',
          group: 'variants',
          signature: 'Property.required<ActualValue = unknown, IncomingValue = ActualValue>(options?: InputSignalOptions<ActualValue, IncomingValue> & { alias?: string }): AccessorDecorator<CustomElement | CustomDirective | StructuralDirective, InputSignal<ActualValue>>',
          snippets: ['components/required-error.txt', 'components/required-branch-error.txt']
        },
        {
          name: 'value',
          group: 'parameters',
          signature: 'value?: ActualValue',
          snippets: ['components/property-type.ts']
        },
        {
          name: 'alias',
          group: 'options',
          signature: 'alias?: string'
        },
        {
          name: 'transform',
          group: 'options',
          signature: 'transform?: (value: IncomingValue) => ActualValue',
          snippets: ['components/transform-type.ts']
        },
        {
          name: 'equals',
          group: 'options',
          signature: 'equals?: (a: ActualValue, b: ActualValue) => boolean'
        },
        {
          name: 'watched',
          group: 'options',
          signature: 'watched?: () => void'
        },
        {
          name: 'unwatched',
          group: 'options',
          signature: 'unwatched?: () => void'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['components/property-options.ts'] },
        { key: 'binding', snippets: ['components/static-number-error.txt'] },
        { key: 'reading', snippets: ['components/read-only-input.ts'] }
      ],
      guides: ['components/inputs', 'templates/binding', 'signals/options', 'directives/custom']
    },
    {
      name: 'Event',
      kind: 'decorator',
      signature: 'function Event<Data = void>(options?: Partial<EventOptions>): AccessorDecorator<CustomElement | CustomDirective, Output<Data>>',
      members: [
        {
          name: 'bubbles',
          group: 'options',
          signature: 'bubbles?: boolean'
        },
        {
          name: 'cancelable',
          group: 'options',
          signature: 'cancelable?: boolean',
          snippets: ['api/core/cancelable-event.ts']
        },
        {
          name: 'composed',
          group: 'options',
          signature: 'composed?: boolean'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['components/event-declaration.ts'] },
        { key: 'names', snippets: ['components/unknown-event-error.txt', 'components/member-name-clash.ts'] }
      ],
      guides: ['components/outputs', 'templates/events', 'directives/custom']
    },
    {
      name: 'Query',
      kind: 'decorator',
      signature: 'function Query<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string>(target: Target): AccessorDecorator<CustomElement, QuerySignal<QueryElement<Target, ElementType> | null>>\nfunction Query<ElementType extends Element = HTMLElement>(target: QueryTarget, options: { read: \'element\' }): AccessorDecorator<CustomElement, QuerySignal<ElementType | null>>\nfunction Query<Read extends Constructor<CustomDirective>>(target: QueryTarget, options: { read: Read }): AccessorDecorator<CustomElement, QuerySignal<InstanceType<Read> | null>>',
      members: [
        {
          name: 'Query.required',
          group: 'variants',
          signature: 'Query.required<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string>(target: Target, options?: QueryOptions): AccessorDecorator<CustomElement, QuerySignal<QueryElement<Target, ElementType>>>',
          snippets: ['components/query-required.ts']
        },
        {
          name: 'Query.all',
          group: 'variants',
          signature: 'Query.all<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string>(target: Target): AccessorDecorator<CustomElement, QuerySignal<QueryElement<Target, ElementType>[]>>'
        },
        {
          name: 'Query.ref',
          group: 'variants',
          signature: 'Query.ref<ElementType extends Element = HTMLElement>(name: string, options?: QueryOptions): AccessorDecorator<CustomElement, QuerySignal<ElementType | null>>'
        },
        {
          name: 'Query.ref.required',
          group: 'variants',
          signature: 'Query.ref.required<ElementType extends Element = HTMLElement>(name: string, options?: QueryOptions): AccessorDecorator<CustomElement, QuerySignal<ElementType>>'
        },
        {
          name: 'Query.ref.all',
          group: 'variants',
          signature: 'Query.ref.all<ElementType extends Element = HTMLElement>(name: string): AccessorDecorator<CustomElement, QuerySignal<ElementType[]>>'
        },
        {
          name: 'Query.content',
          group: 'variants',
          signature: 'Query.content<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string>(target: Target, options?: QuerySlotOptions & QueryOptions): AccessorDecorator<CustomElement, QuerySignal<QueryElement<Target, ElementType> | null>>'
        },
        {
          name: 'Query.content.required',
          group: 'variants',
          signature: 'Query.content.required<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string>(target: Target, options?: QuerySlotOptions & QueryOptions): AccessorDecorator<CustomElement, QuerySignal<QueryElement<Target, ElementType>>>'
        },
        {
          name: 'Query.content.all',
          group: 'variants',
          signature: 'Query.content.all<ElementType extends HTMLElement = HTMLElement, Target extends QueryTarget = string>(target: Target, options?: QuerySlotOptions): AccessorDecorator<CustomElement, QuerySignal<QueryElement<Target, ElementType>[]>>'
        },
        {
          name: 'target',
          group: 'parameters',
          signature: 'target: QueryTarget',
          snippets: ['components/query-undecorated-error.txt']
        },
        {
          name: 'name',
          group: 'parameters',
          signature: 'name: string'
        },
        {
          name: 'read',
          group: 'options',
          signature: 'read?: QueryRead',
          snippets: ['api/core/query-read.ts']
        },
        {
          name: 'slots',
          group: 'options',
          signature: 'slots?: string | string[]'
        },
        {
          name: 'lightDom',
          group: 'options',
          signature: 'lightDom?: boolean'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['components/query-decorators.ts'] },
        { key: 'timing', snippets: ['api/core/query-timing.ts'] },
        { key: 'content', snippets: ['api/core/query-content.ts', 'api/core/query-content-options.ts'] },
        { key: 'state' }
      ],
      guides: ['components/queries', 'components/content-queries', 'components/content-projection', 'components/dom-apis', 'templates/element-refs']
    },
    {
      name: 'HostProperty',
      kind: 'decorator',
      signature: 'function HostProperty(name: string): HostPropertyDecorator\n\ntype HostPropertyDecorator = {\n  <This extends CustomElement | CustomDirective, Value>(value: undefined, context: ClassFieldDecoratorContext<This, Value>): void;\n  <This extends CustomElement | CustomDirective, Value>(value: (this: This) => Value, context: ClassGetterDecoratorContext<This, Value>): void;\n  <This extends CustomElement | CustomDirective, Value>(value: ClassAccessorDecoratorTarget<This, Value>, context: ClassAccessorDecoratorContext<This, Value>): void;\n};',
      members: [
        {
          name: 'name',
          group: 'parameters',
          signature: 'name: string'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['api/core/host-property.ts'] },
        { key: 'values', snippets: ['api/core/host-property-values.ts'] },
        { key: 'timing' },
        { key: 'conflicts' },
        { key: 'directives', snippets: ['api/core/host-bindings-directive.ts'] },
        { key: 'errors', snippets: ['api/core/host-bindings-errors.txt', 'api/core/host-bindings-structural-error.txt'] }
      ],
      guides: ['components/host-bindings', 'components/styling', 'directives/custom']
    },
    {
      name: 'HostEvent',
      kind: 'decorator',
      signature: 'function HostEvent(name: string, options?: Pick<AddEventListenerOptions, \'capture\' | \'once\' | \'passive\'>): HostEventDecorator\n\ntype HostEventDecorator = <This extends CustomElement | CustomDirective, EventType extends Event>(value: (this: This, event: EventType) => unknown, context: ClassMethodDecoratorContext<This, (this: This, event: EventType) => unknown>) => void;',
      members: [
        {
          name: 'name',
          group: 'parameters',
          signature: 'name: string'
        },
        {
          name: 'capture',
          group: 'options',
          signature: 'capture?: boolean'
        },
        {
          name: 'once',
          group: 'options',
          signature: 'once?: boolean'
        },
        {
          name: 'passive',
          group: 'options',
          signature: 'passive?: boolean'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['api/core/host-event.ts'] },
        { key: 'reach' },
        { key: 'timing' },
        { key: 'directives', snippets: ['api/core/host-bindings-directive.ts'] },
        { key: 'errors', snippets: ['api/core/host-bindings-errors.txt', 'api/core/host-bindings-structural-error.txt'] }
      ],
      guides: ['components/host-bindings', 'components/outputs', 'templates/events', 'directives/custom']
    },
    {
      name: 'CustomElement',
      kind: 'class',
      signature: 'class CustomElement extends HTMLElement {\n  readonly hostDirectives: HostDirectives;\n  onInit?(): void;\n  afterRender?(): void;\n  onDestroy?(): void;\n  effect(fn: () => void, options?: EffectOptions): () => void;\n}',
      members: [
        {
          name: 'hostDirectives',
          group: 'properties',
          signature: 'readonly hostDirectives: HostDirectives',
          snippets: ['directives/host-directive.ts']
        },
        {
          name: 'onInit',
          group: 'methods',
          signature: 'onInit?(): void'
        },
        {
          name: 'afterRender',
          group: 'methods',
          signature: 'afterRender?(): void'
        },
        {
          name: 'onDestroy',
          group: 'methods',
          signature: 'onDestroy?(): void'
        },
        {
          name: 'effect',
          group: 'methods',
          signature: 'effect(fn: () => void, options?: EffectOptions): () => void'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['components/lifecycle-hooks.ts', 'components/lifecycle-order.txt'] },
        { key: 'callbacks', snippets: ['components/connected-callback.ts', 'components/attach-shadow.ts'] },
        { key: 'decorated', snippets: ['components/manual-subclass.ts'] },
        { key: 'names', snippets: ['components/member-name-clash.ts'] }
      ],
      guides: ['components/anatomy', 'components/lifecycle', 'components/dom-apis', 'components/inheritance', 'signals/effects']
    },
    {
      name: 'CustomDirective',
      kind: 'class',
      signature: 'abstract class CustomDirective<T extends Element = Element> {\n  get element(): T;\n  onInit?(): void;\n  onDestroy?(): void;\n  effect(fn: () => void, options?: EffectOptions): () => void;\n  dispatchEvent(event: CustomEvent): boolean;\n}',
      members: [
        {
          name: 'element',
          group: 'properties',
          signature: 'get element(): T'
        },
        {
          name: 'onInit',
          group: 'methods',
          signature: 'onInit?(): void',
          snippets: ['directives/constructor-access.ts']
        },
        {
          name: 'onDestroy',
          group: 'methods',
          signature: 'onDestroy?(): void'
        },
        {
          name: 'effect',
          group: 'methods',
          signature: 'effect(fn: () => void, options?: EffectOptions): () => void'
        },
        {
          name: 'dispatchEvent',
          group: 'methods',
          signature: 'dispatchEvent(event: CustomEvent): boolean'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['api/core/custom-directive.ts', 'api/core/custom-directive-usage.html'] },
        { key: 'conditional', snippets: ['directives/conditional-directive-syntax.html'] }
      ],
      guides: ['directives/custom', 'directives/overview', 'directives/conditional']
    },
    {
      name: 'StructuralDirective',
      kind: 'class',
      signature: 'abstract class StructuralDirective {\n  abstract shouldRender(): boolean | Promise<boolean>;\n}',
      members: [
        {
          name: 'shouldRender',
          group: 'methods',
          signature: 'abstract shouldRender(): boolean | Promise<boolean>'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['api/core/structural-directive.ts', 'api/core/structural-directive-usage.html'] },
        { key: 'limits', snippets: ['directives/structural-errors.txt'] }
      ],
      guides: ['directives/structural', 'directives/conditional', 'directives/overview']
    },
    {
      name: 'Output',
      kind: 'class',
      signature: 'class Output<Value = void> {\n  emit: (...args: Value extends void ? [options?: EventOptions] : [value: Value, options?: EventOptions]) => void;\n}',
      members: [
        {
          name: 'emit',
          group: 'methods',
          signature: 'emit: (...args: Value extends void ? [options?: EventOptions] : [value: Value, options?: EventOptions]) => void',
          snippets: ['api/core/output-emit.ts']
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['components/event-declaration.ts'] }
      ],
      guides: ['components/outputs', 'directives/custom']
    },
    {
      name: 'EventOptions',
      kind: 'class',
      signature: 'class EventOptions implements EventInit {\n  constructor(options: Partial<EventOptions>);\n  get bubbles(): boolean | undefined;\n  get cancelable(): boolean | undefined;\n  get composed(): boolean | undefined;\n}',
      members: [
        {
          name: 'bubbles',
          group: 'properties',
          signature: 'get bubbles(): boolean | undefined'
        },
        {
          name: 'cancelable',
          group: 'properties',
          signature: 'get cancelable(): boolean | undefined'
        },
        {
          name: 'composed',
          group: 'properties',
          signature: 'get composed(): boolean | undefined'
        }
      ],
      usage: [
        { key: 'emission', snippets: ['components/event-declaration.ts'] }
      ],
      guides: ['components/outputs']
    },
    {
      name: 'WebComponentOptions',
      kind: 'type',
      signature: 'type WebComponentOptions = {\n  selector: string;\n  hostDirectives?: Array<Constructor<CustomDirective> | HostDirectiveOptions>;\n  styleUrl?: string;\n  templateUrl: string;\n};',
      members: [
        {
          name: 'selector',
          group: 'properties',
          signature: 'selector: string'
        },
        {
          name: 'hostDirectives',
          group: 'properties',
          signature: 'hostDirectives?: Array<Constructor<CustomDirective> | HostDirectiveOptions>'
        },
        {
          name: 'styleUrl',
          group: 'properties',
          signature: 'styleUrl?: string'
        },
        {
          name: 'templateUrl',
          group: 'properties',
          signature: 'templateUrl: string'
        }
      ],
      guides: ['components/anatomy']
    },
    {
      name: 'DirectiveOptions',
      kind: 'type',
      signature: 'type DirectiveOptions = {\n  selector: string;\n};',
      members: [
        {
          name: 'selector',
          group: 'properties',
          signature: 'selector: string'
        }
      ],
      guides: ['directives/overview']
    },
    {
      name: 'HostDirectiveOptions',
      kind: 'type',
      signature: 'type HostDirectiveOptions = {\n  directive: Constructor<CustomDirective>;\n  properties?: HostDirectiveMember[];\n  events?: HostDirectiveMember[];\n};',
      members: [
        {
          name: 'directive',
          group: 'properties',
          signature: 'directive: Constructor<CustomDirective>'
        },
        {
          name: 'properties',
          group: 'properties',
          signature: 'properties?: HostDirectiveMember[]'
        },
        {
          name: 'events',
          group: 'properties',
          signature: 'events?: HostDirectiveMember[]'
        }
      ],
      usage: [
        { key: 'exposing', snippets: ['directives/host-directive.ts', 'directives/host-directive-usage.html'] },
        { key: 'errors', snippets: ['api/core/host-directive-errors.txt'] }
      ],
      guides: ['directives/custom']
    },
    {
      name: 'HostDirectiveMember',
      kind: 'type',
      signature: 'type HostDirectiveMember = string | {\n  name: string;\n  alias: string;\n};',
      members: [
        {
          name: 'name',
          group: 'properties',
          signature: 'name: string'
        },
        {
          name: 'alias',
          group: 'properties',
          signature: 'alias: string'
        }
      ],
      usage: [
        { key: 'forms', snippets: ['api/core/host-directive-members.ts', 'api/core/host-directive-members-usage.html'] }
      ],
      guides: ['directives/custom']
    },
    {
      name: 'HostDirectives',
      kind: 'type',
      signature: 'type HostDirectives = Omit<ReadonlyMap<Constructor<CustomDirective>, CustomDirective>, \'get\'> & {\n  get<Directive extends CustomDirective>(directive: Constructor<Directive>): Directive | undefined;\n};',
      members: [
        {
          name: 'get',
          group: 'methods',
          signature: 'get<Directive extends CustomDirective>(directive: Constructor<Directive>): Directive | undefined'
        }
      ],
      usage: [
        { key: 'template', snippets: ['directives/host-directive.ts'] }
      ],
      guides: ['directives/custom']
    },
    {
      name: 'createComponent',
      kind: 'function',
      signature: 'function createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<NoInfer<Component>, Directives>): ComponentRef<Component>',
      members: [
        {
          name: 'component',
          group: 'parameters',
          signature: 'component: Constructor<Component>'
        },
        {
          name: 'target',
          group: 'options',
          signature: 'target: Element'
        },
        {
          name: 'properties',
          group: 'options',
          signature: 'properties?: Array<{ [input: string]: () => unknown; condition?: () => boolean }>',
          snippets: ['api/core/create-component-groups.ts']
        },
        {
          name: 'events',
          group: 'options',
          signature: 'events?: Array<{ [event: string]: (event: Event) => unknown; condition?: () => boolean }>'
        },
        {
          name: 'directives',
          group: 'options',
          signature: 'directives?: Array<Constructor<CustomDirective> | { directive: Constructor<CustomDirective>; condition?: () => boolean; properties?: …; events?: … }>',
          snippets: ['api/core/create-component-directives.ts']
        }
      ],
      usage: [
        { key: 'creating', snippets: ['components/create-component.ts'] },
        { key: 'errors', snippets: ['api/core/create-component-errors.txt'] }
      ],
      guides: ['components/dynamic-creation']
    },
    {
      name: 'CreateComponentOptions',
      kind: 'type',
      signature: 'type CreateComponentOptions<Component, Directives extends readonly CustomDirective[] = CustomDirective[]> = {\n  target: Element;\n  properties?: Array<{ [input: string]: () => unknown; condition?: () => boolean }>;\n  events?: Array<{ [event: string]: (event: Event) => unknown; condition?: () => boolean }>;\n  directives?: { [Index in keyof Directives]: Constructor<Directives[Index]> | { directive: Constructor<Directives[Index]>; condition?: () => boolean; properties?: …; events?: … } };\n};',
      members: [
        {
          name: 'target',
          group: 'properties',
          signature: 'target: Element'
        },
        {
          name: 'properties',
          group: 'properties',
          signature: 'properties?: Array<{ [input: string]: () => unknown; condition?: () => boolean }>'
        },
        {
          name: 'events',
          group: 'properties',
          signature: 'events?: Array<{ [event: string]: (event: Event) => unknown; condition?: () => boolean }>'
        },
        {
          name: 'directives',
          group: 'properties',
          signature: 'directives?: { [Index in keyof Directives]: Constructor<Directives[Index]> | { directive: Constructor<Directives[Index]>; condition?: () => boolean; properties?: …; events?: … } }'
        }
      ],
      guides: ['components/dynamic-creation']
    },
    {
      name: 'ComponentRef',
      kind: 'type',
      signature: 'type ComponentRef<Component> = {\n  readonly element: Component;\n  destroy: () => void;\n};',
      members: [
        {
          name: 'element',
          group: 'properties',
          signature: 'readonly element: Component'
        },
        {
          name: 'destroy',
          group: 'methods',
          signature: 'destroy: () => void'
        }
      ],
      guides: ['components/dynamic-creation']
    }
  ]
};
