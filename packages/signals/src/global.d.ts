declare global {
  namespace Signal {
    class State <T = any> {
      constructor(value: T, options?: { equals?: (a: T, b: T) => boolean, watched?: () => void, unwatched?: () => void });
      get(): T;
      set(newValue: T): void;
    }

    class Computed<T = any> {
      constructor(computeFn: () => T, options?: { equals?: (a: T, b: T) => boolean, watched?: () => void, unwatched?: () => void });
      get(): T | { isError: true, value: Error };
    }

    namespace subtle {
      function untrack<T>(fn: () => T): T;
      function currentComputed(): Computed | null;
      function introspectSources(s: Computed | Watcher): (State | Computed)[];
      function introspectSinks(signal: State | Computed): (Computed | Watcher)[];
      function hasSinks(signal: State | Computed): boolean;
      function hasSources(s: Computed | Watcher): boolean;

      class Watcher {
        constructor(notify: () => void);
        watch(...signals: (State | Computed)[]): void;
        unwatch(...signals: (State | Computed)[]): void;
      }
    }
  }
}

export {};