import type { ApiPackage } from '../api.data';
import { PROPERTY_OPTIONS, PROPERTY_TYPE, READ_ONLY_INPUT, TRANSFORM_TYPE } from '../../../components/inputs/inputs.snippets';
import { QUERY_DECORATORS, QUERY_REQUIRED } from '../../../components/queries/queries.snippets';
import { COMPUTED_EQUALS, COMPUTED_MEMBER, EFFECT_BATCHING, EFFECT_CLEANUP, EFFECT_COMPONENT, INPUT_LOCAL_COPY, QUERY_ELEMENT, QUERY_SIGNAL_READ, QUERY_SLOT_OPTIONS, QUERY_TARGET_NATIVE, SIGNAL_COMPONENT, SIGNAL_EQUALS, SIGNAL_IDENTITY, SIGNAL_WATCHED, UNTRACKED_CALL, UNTRACKED_READ } from './core-signals.snippets';
import { QUERY_READ } from './core.snippets';
import { COMPUTED_THIS } from '../../../signals/computed/computed.snippets';
import { INFINITE_LOOP } from '../../../signals/effects/effects.snippets';
import { SIGNAL_API } from '../../../signals/overview/overview.snippets';
import { MEMBERS, STORE } from '../../../signals/shared-state/shared-state.snippets';

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
          snippets: [SIGNAL_EQUALS]
        },
        {
          name: 'watched',
          group: 'options',
          signature: 'watched?: (this: Signal.State<T> | Signal.Computed<T>) => void',
          snippets: [SIGNAL_WATCHED]
        },
        {
          name: 'unwatched',
          group: 'options',
          signature: 'unwatched?: (this: Signal.State<T> | Signal.Computed<T>) => void'
        }
      ],
      usage: [
        { key: 'readingAndWriting', snippets: [SIGNAL_API] },
        { key: 'identity', snippets: [SIGNAL_IDENTITY] },
        { key: 'inAComponent', snippets: [SIGNAL_COMPONENT, 'api/core-signals/signal-component.html'] }
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
          snippets: [COMPUTED_THIS]
        },
        {
          name: 'equals',
          group: 'options',
          signature: 'equals?: SignalEqual<Value>',
          snippets: [COMPUTED_EQUALS]
        }
      ],
      usage: [
        { key: 'inAClass', snippets: [COMPUTED_MEMBER] },
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
          snippets: [EFFECT_CLEANUP]
        }
      ],
      usage: [
        { key: 'batching', snippets: [EFFECT_BATCHING] },
        { key: 'components', snippets: [EFFECT_COMPONENT] },
        { key: 'errors' },
        { key: 'loops', snippets: [INFINITE_LOOP] }
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
        { key: 'currentValue', snippets: [UNTRACKED_READ] },
        { key: 'callingCode', snippets: [UNTRACKED_CALL] },
        { key: 'update' },
        { key: 'polyfill', snippets: ['installation/missing-signals-error.txt'] }
      ],
      guides: ['signals/untracked']
    },
    {
      name: 'Signal',
      kind: 'type',
      signature: `type Signal<Value = unknown> = Pick<Signal.State<Value>, 'get' | 'set'> & {
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
        { key: 'annotating', snippets: [MEMBERS] }
      ],
      guides: ['signals/overview', 'signals/shared-state']
    },
    {
      name: 'Computed',
      kind: 'type',
      signature: `type Computed<Value = unknown> = Pick<Signal.Computed<Value>, 'get'> & {
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
        { key: 'readOnlyViews', snippets: [STORE] }
      ],
      guides: ['signals/computed', 'signals/shared-state']
    },
    {
      name: 'InputSignal',
      kind: 'type',
      signature: `type InputSignal<ActualValue = unknown> = Pick<Signal.State<ActualValue>, 'get'> & {
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
        { key: 'declaring', snippets: [PROPERTY_OPTIONS] },
        { key: 'narrowerTypes', snippets: [PROPERTY_TYPE] },
        { key: 'readOnly', snippets: [READ_ONLY_INPUT, INPUT_LOCAL_COPY] }
      ],
      guides: ['components/inputs']
    },
    {
      name: 'QuerySignal',
      kind: 'type',
      signature: `type QuerySignal<Value = unknown> = Pick<Signal.State<Value>, 'get'> & {
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
        { key: 'declaring', snippets: [QUERY_DECORATORS] },
        { key: 'whenToRead', snippets: [QUERY_SIGNAL_READ] },
        { key: 'required', snippets: [QUERY_REQUIRED] }
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
          snippets: [TRANSFORM_TYPE]
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
        { key: 'passing', snippets: [PROPERTY_OPTIONS] }
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
          snippets: [QUERY_TARGET_NATIVE]
        },
        {
          name: 'directive',
          group: 'variants',
          signature: 'Constructor<CustomDirective>'
        }
      ],
      usage: [
        { key: 'kinds', snippets: [QUERY_DECORATORS] }
      ],
      guides: ['components/queries', 'components/content-queries', 'directives/custom']
    },
    {
      name: 'QueryElement',
      kind: 'type',
      signature: `type QueryElement<Target extends QueryTarget, ElementType extends HTMLElement> =
  Target extends string ? ElementType : InstanceType<Exclude<Target, string>>`,
      usage: [
        { key: 'resolving', snippets: [QUERY_ELEMENT] }
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
        { key: 'choosing', snippets: [QUERY_SLOT_OPTIONS] }
      ],
      guides: ['components/content-queries', 'components/content-projection']
    },
    {
      name: 'QueryOptions',
      kind: 'type',
      signature: `type QueryOptions = {
  read?: QueryRead;
}`,
      members: [
        {
          name: 'read',
          group: 'properties',
          signature: 'read?: QueryRead'
        }
      ],
      usage: [
        { key: 'reading', snippets: [QUERY_READ] }
      ],
      guides: ['components/queries']
    },
    {
      name: 'QueryRead',
      kind: 'type',
      signature: "type QueryRead = 'element' | Constructor<CustomDirective>",
      members: [
        {
          name: 'element',
          group: 'variants',
          signature: "'element'"
        },
        {
          name: 'directive',
          group: 'variants',
          signature: 'Constructor<CustomDirective>'
        }
      ],
      guides: ['components/queries']
    }
  ]
};
