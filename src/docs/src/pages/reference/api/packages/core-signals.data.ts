import type { ApiPackage } from '../api.data';

/**
 * The symbols of `@xaendar/core/signals`.
 */
export const CORE_SIGNALS_API: ApiPackage = {
  name: '@xaendar/core/signals',
  symbols: [
    {
      name: 'signal',
      kind: 'function',
      signature: 'function signal<T = unknown>(value: T, options?: SignalOptions<T>): Signal<T>',
      members: [
        {
          name: 'value',
          group: 'parameters',
          signature: 'value: T'
        },
        {
          name: 'equals',
          group: 'options',
          signature: 'equals?: SignalEqual<T>',
          snippets: ['api/core-signals/signal-equals.ts']
        },
        {
          name: 'watched',
          group: 'options',
          signature: 'watched?: (this: Signal.State<T> | Signal.Computed<T>) => void',
          snippets: ['api/core-signals/signal-watched.ts']
        },
        {
          name: 'unwatched',
          group: 'options',
          signature: 'unwatched?: (this: Signal.State<T> | Signal.Computed<T>) => void'
        }
      ],
      usage: [
        { key: 'readingAndWriting', snippets: ['signals/signal-api.ts'] },
        { key: 'identity', snippets: ['api/core-signals/signal-identity.ts'] },
        { key: 'inAComponent', snippets: ['api/core-signals/signal-component.ts', 'api/core-signals/signal-component.html'] }
      ],
      guides: ['essentials/signals', 'signals/overview', 'signals/options', 'signals/shared-state']
    },
    {
      name: 'computed',
      kind: 'function',
      signature: 'function computed<Value = unknown>(value: (this: Signal.Computed<Value>) => Value, options?: Pick<SignalOptions<Value>, \'equals\'>): Computed<Value>',
      members: [
        {
          name: 'value',
          group: 'parameters',
          signature: 'value: (this: Signal.Computed<Value>) => Value',
          snippets: ['signals/computed-this.ts']
        },
        {
          name: 'equals',
          group: 'options',
          signature: 'equals?: SignalEqual<Value>',
          snippets: ['api/core-signals/computed-equals.ts']
        }
      ],
      usage: [
        { key: 'inAClass', snippets: ['api/core-signals/computed-member.ts'] },
        { key: 'errors' }
      ],
      guides: ['essentials/signals', 'signals/computed', 'signals/shared-state']
    },
    {
      name: 'effect',
      kind: 'function',
      signature: 'function effect(fn: () => void, options?: EffectOptions): () => void',
      members: [
        {
          name: 'fn',
          group: 'parameters',
          signature: 'fn: () => void'
        },
        {
          name: 'onBeforeRun',
          group: 'options',
          signature: 'onBeforeRun?: () => void'
        },
        {
          name: 'onAfterRun',
          group: 'options',
          signature: 'onAfterRun?: () => void'
        },
        {
          name: 'onCleanup',
          group: 'options',
          signature: 'onCleanup?: () => void',
          snippets: ['api/core-signals/effect-cleanup.ts']
        }
      ],
      usage: [
        { key: 'batching', snippets: ['api/core-signals/effect-batching.ts'] },
        { key: 'components', snippets: ['api/core-signals/effect-component.ts'] },
        { key: 'errors' },
        { key: 'loops', snippets: ['signals/infinite-loop.ts'] }
      ],
      guides: ['essentials/signals', 'signals/effects', 'components/lifecycle']
    },
    {
      name: 'untracked',
      kind: 'function',
      signature: 'const untracked: <T>(fn: () => T) => T',
      members: [
        {
          name: 'fn',
          group: 'parameters',
          signature: 'fn: () => T'
        }
      ],
      usage: [
        { key: 'currentValue', snippets: ['api/core-signals/untracked-read.ts'] },
        { key: 'callingCode', snippets: ['api/core-signals/untracked-call.ts'] },
        { key: 'update' },
        { key: 'polyfill', snippets: ['installation/missing-signals-error.txt'] }
      ],
      guides: ['signals/untracked']
    },
    {
      name: 'Signal',
      kind: 'type',
      signature: `type Signal<Value = unknown> = Signal.State<Value> & {
  (): Value;
  update(updater: (prev: Value) => Value): void;
}`,
      members: [
        {
          name: 'get',
          group: 'methods',
          signature: 'get(): Value'
        },
        {
          name: 'set',
          group: 'methods',
          signature: 'set(newValue: Value): void'
        },
        {
          name: 'update',
          group: 'methods',
          signature: 'update(updater: (prev: Value) => Value): void'
        }
      ],
      usage: [
        { key: 'annotating', snippets: ['signals/members.ts'] }
      ],
      guides: ['signals/overview', 'signals/shared-state']
    },
    {
      name: 'Computed',
      kind: 'type',
      signature: `type Computed<Value = unknown> = Signal.Computed<Value> & {
  (): Value;
}`,
      members: [
        {
          name: 'get',
          group: 'methods',
          signature: 'get(): Value'
        }
      ],
      usage: [
        { key: 'readOnlyViews', snippets: ['signals/store.ts'] }
      ],
      guides: ['signals/computed', 'signals/shared-state']
    },
    {
      name: 'InputSignal',
      kind: 'type',
      signature: `type InputSignal<ActualValue = unknown> = Omit<Signal.State<ActualValue>, 'set'> & {
  (): ActualValue;
}`,
      members: [
        {
          name: 'get',
          group: 'methods',
          signature: 'get(): ActualValue'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['components/property-options.ts'] },
        { key: 'narrowerTypes', snippets: ['components/property-type.ts'] },
        { key: 'readOnly', snippets: ['components/read-only-input.ts', 'api/core-signals/input-local-copy.ts'] }
      ],
      guides: ['components/inputs']
    },
    {
      name: 'QuerySignal',
      kind: 'type',
      signature: `type QuerySignal<Value = unknown> = Omit<Signal.State<Value>, 'set'> & {
  (): Value;
}`,
      members: [
        {
          name: 'get',
          group: 'methods',
          signature: 'get(): Value'
        }
      ],
      usage: [
        { key: 'declaring', snippets: ['components/query-decorators.ts'] },
        { key: 'whenToRead', snippets: ['api/core-signals/query-signal-read.ts'] },
        { key: 'required', snippets: ['components/query-required.ts'] }
      ],
      guides: ['components/queries', 'components/content-queries']
    },
    {
      name: 'EffectOptions',
      kind: 'type',
      signature: `type EffectOptions = {
  onCleanup?: () => void;
  onBeforeRun?: () => void;
  onAfterRun?: () => void;
}`,
      members: [
        {
          name: 'onBeforeRun',
          group: 'properties',
          signature: 'onBeforeRun?: () => void'
        },
        {
          name: 'onAfterRun',
          group: 'properties',
          signature: 'onAfterRun?: () => void'
        },
        {
          name: 'onCleanup',
          group: 'properties',
          signature: 'onCleanup?: () => void'
        }
      ],
      guides: ['signals/effects']
    },
    {
      name: 'InputSignalOptions',
      kind: 'type',
      signature: `type InputSignalOptions<ActualValue = unknown, IncomingValue = ActualValue> = SignalOptions<ActualValue> & {
  transform?: (value: IncomingValue) => ActualValue;
}`,
      members: [
        {
          name: 'transform',
          group: 'properties',
          signature: 'transform?: (value: IncomingValue) => ActualValue',
          snippets: ['components/transform-type.ts']
        },
        {
          name: 'equals',
          group: 'properties',
          signature: 'equals?: SignalEqual<ActualValue>'
        },
        {
          name: 'watched',
          group: 'properties',
          signature: 'watched?: (this: Signal.State<ActualValue> | Signal.Computed<ActualValue>) => void'
        },
        {
          name: 'unwatched',
          group: 'properties',
          signature: 'unwatched?: (this: Signal.State<ActualValue> | Signal.Computed<ActualValue>) => void'
        }
      ],
      usage: [
        { key: 'passing', snippets: ['components/property-options.ts'] }
      ],
      guides: ['components/inputs', 'signals/options']
    },
    {
      name: 'QueryTarget',
      kind: 'type',
      signature: 'type QueryTarget = string | Constructor<HTMLElement> | Constructor<CustomDirective>',
      members: [
        {
          name: 'selector',
          group: 'variants',
          signature: 'string'
        },
        {
          name: 'class',
          group: 'variants',
          signature: 'Constructor<HTMLElement>',
          snippets: ['api/core-signals/query-target-native.ts']
        },
        {
          name: 'directive',
          group: 'variants',
          signature: 'Constructor<CustomDirective>'
        }
      ],
      usage: [
        { key: 'kinds', snippets: ['components/query-decorators.ts'] }
      ],
      guides: ['components/queries', 'components/content-queries', 'directives/custom']
    },
    {
      name: 'QueryElement',
      kind: 'type',
      signature: `type QueryElement<Target extends QueryTarget, ElementType extends HTMLElement> =
  Target extends string ? ElementType : InstanceType<Exclude<Target, string>>`,
      usage: [
        { key: 'resolving', snippets: ['api/core-signals/query-element.ts'] }
      ],
      guides: ['components/queries', 'components/content-queries']
    },
    {
      name: 'QuerySlotOptions',
      kind: 'type',
      signature: `type QuerySlotOptions = {
  slots?: string | string[];
  lightDom?: false;
} | {
  lightDom: true;
  slots?: never;
}`,
      members: [
        {
          name: 'slots',
          group: 'properties',
          signature: 'slots?: string | string[]'
        },
        {
          name: 'lightDom',
          group: 'properties',
          signature: 'lightDom?: boolean'
        }
      ],
      usage: [
        { key: 'choosing', snippets: ['api/core-signals/query-slot-options.ts'] }
      ],
      guides: ['components/content-queries', 'components/content-projection']
    }
  ]
};
