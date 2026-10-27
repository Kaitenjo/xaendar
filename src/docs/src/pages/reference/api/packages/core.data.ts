import type { ApiPackage } from '../api.data';
import { ATTACH_SHADOW, NON_LITERAL_OPTIONS, WEB_COMPONENT_OPTIONS } from '../../../components/anatomy/anatomy.snippets';
import { CREATE_COMPONENT, CREATE_COMPONENT_CONTENT } from '../../../components/dynamic-creation/dynamic-creation.snippets';
import { MANUAL_SUBCLASS } from '../../../components/inheritance/inheritance.snippets';
import { PROPERTY_OPTIONS, PROPERTY_TYPE, READ_ONLY_INPUT, TRANSFORM_TYPE } from '../../../components/inputs/inputs.snippets';
import { CONNECTED_CALLBACK, LIFECYCLE_HOOKS } from '../../../components/lifecycle/lifecycle.snippets';
import { EVENT_DECLARATION, MEMBER_NAME_CLASH } from '../../../components/outputs/outputs.snippets';
import { QUERY_DECORATORS, QUERY_REQUIRED } from '../../../components/queries/queries.snippets';
import { CONSTRUCTOR_ACCESS, HOST_DIRECTIVE } from '../../../directives/custom/custom.snippets';
import { DIRECTIVE_REGISTRATION } from '../../../directives/overview/overview.snippets';
import { CANCELABLE_EVENT, CREATE_COMPONENT_DIRECTIVES, CREATE_COMPONENT_GROUPS, CUSTOM_DIRECTIVE, DIRECTIVE_CREATE_COMPONENT, DIRECTIVE_KINDS, HOST_BINDINGS_DIRECTIVE, HOST_DIRECTIVE_MEMBERS, HOST_EVENT, HOST_PROPERTY, HOST_PROPERTY_VALUES, OUTPUT_EMIT, QUERY_CONTENT, QUERY_CONTENT_OPTIONS, QUERY_READ, QUERY_TIMING, STRUCTURAL_DIRECTIVE } from './core.snippets';

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
          snippets: [HOST_DIRECTIVE]
        }
      ],
      usage: [
        { key: 'declaring', snippets: [WEB_COMPONENT_OPTIONS] },
        { key: 'literals', snippets: [NON_LITERAL_OPTIONS, 'components/non-literal-options-error.txt'] },
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
        { key: 'declaring', snippets: [DIRECTIVE_KINDS, 'directives/directive-syntax.html'] },
        { key: 'importing', snippets: [DIRECTIVE_REGISTRATION, 'directives/not-imported-error.txt'] },
        { key: 'prefix', snippets: ['directives/wrong-kind-error.txt', 'directives/missing-registration-error.txt'] }
      ],
      guides: ['directives/overview', 'directives/custom', 'directives/structural']
    },
    {
      name: 'Property',
      kind: 'decorator',
      signature: 'function Property<Value extends InputSignal<ActualValue>, IncomingValue = Value extends InputSignal<infer Type> ? Type : unknown, ActualValue = Value extends InputSignal<infer Type> ? Type : unknown>(value?: ActualValue, options?: InputSignalOptions<ActualValue, IncomingValue> & { alias?: string }): AccessorDecorator<CustomElement | CustomDirective | StructuralDirective, InputSignal<ActualValue>>',
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
          snippets: [PROPERTY_TYPE]
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
          snippets: [TRANSFORM_TYPE]
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
        { key: 'declaring', snippets: [PROPERTY_OPTIONS] },
        { key: 'binding', snippets: ['components/static-number-error.txt'] },
        { key: 'reading', snippets: [READ_ONLY_INPUT] }
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
          snippets: [CANCELABLE_EVENT]
        },
        {
          name: 'composed',
          group: 'options',
          signature: 'composed?: boolean'
        }
      ],
      usage: [
        { key: 'declaring', snippets: [EVENT_DECLARATION] },
        { key: 'names', snippets: ['components/unknown-event-error.txt', MEMBER_NAME_CLASH] }
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
          snippets: [QUERY_REQUIRED]
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
          snippets: [QUERY_READ]
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
        { key: 'declaring', snippets: [QUERY_DECORATORS] },
        { key: 'timing', snippets: [QUERY_TIMING] },
        { key: 'content', snippets: [QUERY_CONTENT, QUERY_CONTENT_OPTIONS] },
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
        { key: 'declaring', snippets: [HOST_PROPERTY] },
        { key: 'values', snippets: [HOST_PROPERTY_VALUES] },
        { key: 'timing' },
        { key: 'conflicts' },
        { key: 'directives', snippets: [HOST_BINDINGS_DIRECTIVE] },
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
        { key: 'declaring', snippets: [HOST_EVENT] },
        { key: 'reach' },
        { key: 'timing' },
        { key: 'directives', snippets: [HOST_BINDINGS_DIRECTIVE] },
        { key: 'errors', snippets: ['api/core/host-bindings-errors.txt', 'api/core/host-bindings-structural-error.txt'] }
      ],
      guides: ['components/host-bindings', 'components/outputs', 'templates/events', 'directives/custom']
    },
    {
      name: 'CustomElement',
      kind: 'class',
      signature: 'class CustomElement extends HTMLElement {\n  readonly hostDirectives: HostDirectives;\n  onInit?(): void;\n  afterRender?(): void;\n  effect(fn: () => void, options?: EffectOptions): () => void;\n  createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<NoInfer<Component>, Directives>): ComponentRef<Component>;\n  onDestroy?(): void;\n}',
      members: [
        {
          name: 'hostDirectives',
          group: 'properties',
          signature: 'readonly hostDirectives: HostDirectives',
          snippets: [HOST_DIRECTIVE]
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
        },
        {
          name: 'createComponent',
          group: 'methods',
          signature: 'createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<NoInfer<Component>, Directives>): ComponentRef<Component>',
          snippets: [CREATE_COMPONENT]
        }
      ],
      usage: [
        { key: 'declaring', snippets: [LIFECYCLE_HOOKS, 'components/lifecycle-order.txt'] },
        { key: 'callbacks', snippets: [CONNECTED_CALLBACK, ATTACH_SHADOW] },
        { key: 'decorated', snippets: [MANUAL_SUBCLASS] },
        { key: 'names', snippets: [MEMBER_NAME_CLASH] }
      ],
      guides: ['components/anatomy', 'components/lifecycle', 'components/dom-apis', 'components/inheritance', 'components/dynamic-creation', 'signals/effects']
    },
    {
      name: 'CustomDirective',
      kind: 'class',
      signature: 'abstract class CustomDirective<T extends Element = Element> {\n  get element(): T;\n  onInit?(): void;\n  effect(fn: () => void, options?: EffectOptions): () => void;\n  createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<NoInfer<Component>, Directives>): ComponentRef<Component>;\n  dispatchEvent(event: CustomEvent): boolean;\n  onDestroy?(): void;\n}',
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
          snippets: [CONSTRUCTOR_ACCESS]
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
          name: 'createComponent',
          group: 'methods',
          signature: 'createComponent<Component extends CustomElement, const Directives extends readonly CustomDirective[] = []>(component: Constructor<Component>, options: CreateComponentOptions<NoInfer<Component>, Directives>): ComponentRef<Component>',
          snippets: [DIRECTIVE_CREATE_COMPONENT]
        },
        {
          name: 'dispatchEvent',
          group: 'methods',
          signature: 'dispatchEvent(event: CustomEvent): boolean'
        }
      ],
      usage: [
        { key: 'declaring', snippets: [CUSTOM_DIRECTIVE, 'api/core/custom-directive-usage.html'] },
        { key: 'conditional', snippets: ['directives/conditional-directive-syntax.html'] }
      ],
      guides: ['directives/custom', 'directives/overview', 'directives/conditional', 'components/dynamic-creation']
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
        { key: 'declaring', snippets: [STRUCTURAL_DIRECTIVE, 'api/core/structural-directive-usage.html'] },
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
          snippets: [OUTPUT_EMIT]
        }
      ],
      usage: [
        { key: 'declaring', snippets: [EVENT_DECLARATION] }
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
        { key: 'emission', snippets: [EVENT_DECLARATION] }
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
        { key: 'exposing', snippets: [HOST_DIRECTIVE, 'directives/host-directive-usage.html'] },
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
        { key: 'forms', snippets: [HOST_DIRECTIVE_MEMBERS, 'api/core/host-directive-members-usage.html'] }
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
        { key: 'template', snippets: [HOST_DIRECTIVE] }
      ],
      guides: ['directives/custom']
    },
    {
      name: 'CreateComponentOptions',
      kind: 'type',
      signature: 'type CreateComponentOptions<Component, Directives extends readonly CustomDirective[] = CustomDirective[]> = {\n  target: Element;\n  properties?: Array<{ [input: string]: () => unknown; condition?: () => boolean }>;\n  events?: Array<{ [event: string]: (event: Event) => unknown; condition?: () => boolean }>;\n  directives?: { [Index in keyof Directives]: Constructor<Directives[Index]> | { directive: Constructor<Directives[Index]>; condition?: () => boolean; properties?: …; events?: … } };\n  content?: Node[];\n};',
      members: [
        {
          name: 'target',
          group: 'properties',
          signature: 'target: Element'
        },
        {
          name: 'properties',
          group: 'properties',
          signature: 'properties?: Array<{ [input: string]: () => unknown; condition?: () => boolean }>',
          snippets: [CREATE_COMPONENT_GROUPS]
        },
        {
          name: 'events',
          group: 'properties',
          signature: 'events?: Array<{ [event: string]: (event: Event) => unknown; condition?: () => boolean }>'
        },
        {
          name: 'directives',
          group: 'properties',
          signature: 'directives?: { [Index in keyof Directives]: Constructor<Directives[Index]> | { directive: Constructor<Directives[Index]>; condition?: () => boolean; properties?: …; events?: … } }',
          snippets: [CREATE_COMPONENT_DIRECTIVES]
        },
        {
          name: 'content',
          group: 'properties',
          signature: 'content?: Node[]',
          snippets: [CREATE_COMPONENT_CONTENT]
        }
      ],
      usage: [
        { key: 'errors', snippets: ['api/core/create-component-errors.txt'] }
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
