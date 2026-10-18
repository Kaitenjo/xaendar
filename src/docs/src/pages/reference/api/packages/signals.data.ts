import type { ApiPackage } from '../api.data';

/**
 * The symbols of `@xaendar/signals`.
 */
export const SIGNALS_API: ApiPackage = {
  name: '@xaendar/signals',
  symbols: [
    {
      name: 'loadSignals',
      kind: 'function',
      signature: 'function loadSignals(options?: { devMode?: boolean }): void',
      members: [
        {
          name: 'devMode',
          group: 'options',
          signature: 'devMode?: boolean',
          snippets: ['signals/dev-mode.ts']
        }
      ],
      usage: [
        { key: 'entryPoint', snippets: ['installation/main.ts'] },
        { key: 'missing', snippets: ['installation/missing-signals-error.txt'] },
        { key: 'specs', snippets: ['api/signals/signals-setup.ts'] }
      ],
      guides: ['installation', 'signals/advanced']
    },
    {
      name: 'SignalOptions',
      kind: 'type',
      signature: [
        'type SignalOptions<T> = {',
        '  equals?: SignalEqual<T>;',
        '  watched?: (this: Signal.State<T> | Signal.Computed<T>) => void;',
        '  unwatched?: (this: Signal.State<T> | Signal.Computed<T>) => void;',
        '};'
      ].join('\n'),
      members: [
        {
          name: 'equals',
          group: 'options',
          signature: 'equals?: SignalEqual<T>'
        },
        {
          name: 'watched',
          group: 'options',
          signature: 'watched?: (this: Signal.State<T> | Signal.Computed<T>) => void'
        },
        {
          name: 'unwatched',
          group: 'options',
          signature: 'unwatched?: (this: Signal.State<T> | Signal.Computed<T>) => void'
        }
      ],
      usage: [
        { key: 'equality', snippets: ['api/signals/equals.ts'] },
        { key: 'source', snippets: ['api/signals/watched-clock.ts'] }
      ],
      guides: ['signals/options', 'signals/overview', 'signals/computed', 'components/inputs']
    },
    {
      name: 'SignalEqual',
      kind: 'type',
      signature: 'type SignalEqual<T> = (this: Signal.State<T> | Signal.Computed<T>, t: any, t2: any) => boolean;',
      members: [
        {
          name: 'this',
          group: 'parameters',
          signature: 'this: Signal.State<T> | Signal.Computed<T>'
        },
        {
          name: 't',
          group: 'parameters',
          signature: 't: any'
        },
        {
          name: 't2',
          group: 'parameters',
          signature: 't2: any'
        }
      ],
      usage: [
        { key: 'reusable', snippets: ['api/signals/signal-equal.ts'] }
      ],
      guides: ['signals/overview', 'signals/options']
    },
    {
      name: 'ExtractSignalType',
      kind: 'type',
      signature: 'type ExtractSignalType<T> = T extends Signal.State<infer U> ? U : never;',
      usage: [
        { key: 'deriving', snippets: ['api/signals/extract-signal-type.ts'] }
      ]
    },
    {
      name: 'Signal.State',
      kind: 'global',
      signature: [
        'class Signal.State<T = any> {',
        '  constructor(initialValue: T, options?: SignalOptions<T>);',
        '  get(): T;',
        '  set(newValue: T): void;',
        '}'
      ].join('\n'),
      members: [
        {
          name: 'initialValue',
          group: 'parameters',
          signature: 'initialValue: T'
        },
        {
          name: 'options',
          group: 'parameters',
          signature: 'options?: SignalOptions<T>'
        },
        {
          name: 'get',
          group: 'methods',
          signature: 'get(): T'
        },
        {
          name: 'set',
          group: 'methods',
          signature: 'set(newValue: T): void'
        }
      ],
      usage: [
        { key: 'direct', snippets: ['api/signals/state.ts'] },
        { key: 'wrapper', snippets: ['api/signals/state-wrapper.ts'] }
      ],
      guides: ['signals/advanced', 'signals/overview']
    },
    {
      name: 'Signal.Computed',
      kind: 'global',
      signature: [
        'class Signal.Computed<T = any> {',
        '  constructor(callback: (this: Signal.Computed<T>) => T, options?: Pick<SignalOptions<T>, \'equals\'>);',
        '  get(): T;',
        '}'
      ].join('\n'),
      members: [
        {
          name: 'callback',
          group: 'parameters',
          signature: 'callback: (this: Signal.Computed<T>) => T',
          snippets: ['signals/computed-this.ts']
        },
        {
          name: 'options',
          group: 'parameters',
          signature: 'options?: Pick<SignalOptions<T>, \'equals\'>'
        },
        {
          name: 'get',
          group: 'methods',
          signature: 'get(): T'
        }
      ],
      usage: [
        { key: 'direct', snippets: ['api/signals/computed.ts'] }
      ],
      guides: ['signals/computed', 'signals/advanced']
    },
    {
      name: 'Signal.subtle',
      kind: 'global',
      signature: [
        'namespace Signal.subtle {',
        '  function untrack<T>(fn: () => T): T;',
        '  function currentComputed(): Signal.Computed | null;',
        '  function introspectSources(node: Signal.Computed | Watcher): Array<Signal.State | Signal.Computed>;',
        '  function introspectSinks(signal: Signal.State | Signal.Computed): Array<Signal.Computed | Watcher>;',
        '  function hasSources(node: Signal.Computed | Watcher): boolean;',
        '  function hasSinks(signal: Signal.State | Signal.Computed): boolean;',
        '',
        '  class Watcher {',
        '    constructor(notify: (this: Watcher) => void);',
        '    watch(...signals: Array<Signal.State | Signal.Computed>): void;',
        '    unwatch(...signals: Array<Signal.State | Signal.Computed>): void;',
        '    getPending(): Signal.Computed[];',
        '  }',
        '}'
      ].join('\n'),
      members: [
        {
          name: 'Watcher',
          group: 'properties',
          signature: 'class Watcher {\n  constructor(notify: (this: Watcher) => void);\n}'
        },
        {
          name: 'untrack',
          group: 'methods',
          signature: 'untrack<T>(fn: () => T): T'
        },
        {
          name: 'currentComputed',
          group: 'methods',
          signature: 'currentComputed(): Signal.Computed | null'
        },
        {
          name: 'introspectSources',
          group: 'methods',
          signature: 'introspectSources(node: Signal.Computed | Watcher): Array<Signal.State | Signal.Computed>'
        },
        {
          name: 'introspectSinks',
          group: 'methods',
          signature: 'introspectSinks(signal: Signal.State | Signal.Computed): Array<Signal.Computed | Watcher>'
        },
        {
          name: 'hasSources',
          group: 'methods',
          signature: 'hasSources(node: Signal.Computed | Watcher): boolean'
        },
        {
          name: 'hasSinks',
          group: 'methods',
          signature: 'hasSinks(signal: Signal.State | Signal.Computed): boolean'
        },
        {
          name: 'Watcher.prototype.watch',
          group: 'methods',
          signature: 'watch(...signals: Array<Signal.State | Signal.Computed>): void'
        },
        {
          name: 'Watcher.prototype.unwatch',
          group: 'methods',
          signature: 'unwatch(...signals: Array<Signal.State | Signal.Computed>): void'
        },
        {
          name: 'Watcher.prototype.getPending',
          group: 'methods',
          signature: 'getPending(): Signal.Computed[]'
        }
      ],
      usage: [
        { key: 'effect', snippets: ['api/signals/watcher-effect.ts'] },
        { key: 'introspection', snippets: ['api/signals/introspection.ts'] },
        { key: 'frozen', snippets: ['api/signals/frozen-errors.txt'] }
      ],
      guides: ['signals/advanced', 'signals/untracked', 'signals/effects']
    }
  ]
};
