import type { EffectOptions } from '../../signals/types/effect-options.type';
import type { EffectCallback } from '../../types/effect-callback.type';
import type { Effect } from '../../types/effect.type';
import { queueWatcher } from '../../utils/effect-queue/effect-queue.util';

/**
 * The class of the effects, defined by the first effect created (see {@link defineEffectClass}).
 */
let EffectClass: ReturnType<typeof defineEffectClass> | undefined;

/**
 * Creates an effect, running its callback a first time, synchronously. An effect is a side effect re-run whenever a
 * signal it read changes, built only on the public API of the signals: it is the `Signal.Computed` its callback runs in,
 * watched by a `Signal.subtle.Watcher` of its own, and allocates no closure.
 *
 * @template First - The type of the first argument of the callback.
 * @template Second - The type of the second argument of the callback.
 * @template Third - The type of the third argument of the callback.
 * @param callback - The callback, called with the three arguments. Any signal read inside it is tracked as a dependency.
 * @param options - The hooks called around each run and on disposal.
 * @param first - The first argument of the callback.
 * @param second - The second argument of the callback.
 * @param third - The third argument of the callback.
 * @returns The effect.
 * @throws The exception thrown by the first run: the effect is torn down, its `onCleanup` not called.
 */
export function createEffect<First, Second, Third>(callback: EffectCallback<First, Second, Third>, options?: EffectOptions, first?: First, second?: Second, third?: Third): Effect {
  EffectClass ??= defineEffectClass();
  const effect = new EffectClass(callback, options, first, second, third);
  effect.start();
  return effect;
}

/**
 * Runs the callback of a binding of a template, synchronously, in the computed signal of an effect, which tracks the
 * signals it reads: when it reads at least one, the computed becomes the effect of the binding, watched, so that it runs
 * again whenever one of them changes. When it reads none, nothing is kept: the binding has no reason to run again but
 * the variables of the template it reads, which are not signals (see `_Context.refresh`).
 *
 * The run is the first one of a binding, or the one its scope asks for when a variable it reads changes: each run decides
 * again, since the signals a binding reads can change from one run to the next.
 *
 * N.B. Deliberate, to save memory: a binding reading no signal, the bindings reading only the variables of a template
 * (the item of a `@for`, a `@let`, the parameters of a template), keeps neither the computed signal nor a watcher, and
 * the watcher of the other ones is created only once the run has read a signal. Do not create the watcher before the run,
 * nor keep the computed of a binding reading no signal.
 *
 * @template First - The type of the first argument of the callback.
 * @template Second - The type of the second argument of the callback.
 * @template Third - The type of the third argument of the callback.
 * @param callback - The callback of the binding, called with the three arguments.
 * @param first - The first argument of the callback.
 * @param second - The second argument of the callback.
 * @param third - The third argument of the callback.
 * The run is never a dependency of a computation running around it, as an effect rendering a template: a template
 * renders untracked, so the run is untracked only when one is running, and no closure is created otherwise.
 *
 * @returns The effect of the binding, `null` when the run read no signal.
 * @throws The exception thrown by the run: nothing is watched.
 */
export function _runBinding<First, Second, Third>(callback: EffectCallback<First, Second, Third>, first: First, second?: Second, third?: Third): Effect | null {
  EffectClass ??= defineEffectClass();
  const effect = new EffectClass(callback, undefined, first, second, third);
  const watched = Signal.subtle.currentComputed() ? Signal.subtle.untrack(() => effect.track()) : effect.track();
  return watched ? effect : null;
}

/**
 * Defines the class of the effects, a subclass of `Signal.Computed`, once.
 *
 * It extends `Signal.Computed` so that the computation, which the computed signal calls with itself as `this`, finds the
 * effect without a closure, and the data of the effect lives in the fields the class declares, allocated with the
 * instance, instead of properties added to a computed signal afterwards. The computation and the `notify` of the watcher
 * are functions declared once, at module level (see {@link computeEffect} and `queueWatcher`).
 *
 * The class is defined by the first effect instead of at module level, since `Signal` is installed by `loadSignals()`:
 * the modules of `@xaendar/core` do not need it until they create a signal.
 *
 * N.B. The three generics and the three arguments (`_first`, `_second`, `_third`) exist only for the bindings of the
 * templates (see `_bindEffect`), and are deliberate: do not replace them with a closure, a rest parameter or an object
 * of arguments. The bindings are tens of thousands in a large template, and each one passes its data (the node, the
 * expression, the name...) to a callback declared once at module level, instead of capturing it in an arrow created per
 * binding. Three is the most the bindings need (`toggleReactiveClass(element, name, value)`, `applyProperty(owner,
 * element, binding)`); `_if` and `_for` pass one, their `IfRun` / `ForRun`, and the public `effect()` none, leaving
 * them `undefined`. Three fixed fields give every instance the same shape and cost 8 bytes each when unused, while a
 * closure costs ~60 bytes plus its context, and `...args` or `{ node, textFn }` an array or an object per effect.
 *
 * @returns The class.
 */
function defineEffectClass() {
  return class EffectNode<First, Second, Third> extends Signal.Computed<void> implements Effect {
    /**
     * The callback the effect runs.
     */
    private readonly _callback: EffectCallback<First, Second, Third>;
    /**
     * The hooks of the effect, `undefined` when it has none.
     */
    private readonly _options: EffectOptions | undefined;
    /**
     * The first argument of the callback.
     */
    private readonly _first: First;
    /**
     * The second argument of the callback.
     */
    private readonly _second: Second;
    /**
     * The third argument of the callback.
     */
    private readonly _third: Third;
    /**
     * The watcher of the effect: notified when a signal the last run read changes, it queues itself. `undefined` until
     * the effect is watched (see {@link start} and {@link track}).
     */
    private _watcher: Signal.subtle.Watcher | undefined;

    /**
     * Creates the effect, without running it.
     *
     * @param callback - The callback.
     * @param options - The hooks.
     * @param first - The first argument of the callback.
     * @param second - The second argument of the callback.
     * @param third - The third argument of the callback.
     */
    constructor(callback: EffectCallback<First, Second, Third>, options?: EffectOptions, first?: First, second?: Second, third?: Third) {
      super(computeEffect);
      this._callback = callback;
      this._options = options;
      this._first = first as First;
      this._second = second as Second;
      this._third = third as Third;
    }

    /**
     * Watches the effect, then runs it a first time, synchronously, so that it runs again whenever a signal it read
     * changes, also when it reads none at first.
     *
     * @throws The exception thrown by the first run: the effect is no longer watched.
     */
    public start(): void {
      const watcher = this._watcher = new Signal.subtle.Watcher(queueWatcher);
      watcher.watch(this);
      try {
        this.get();
      } catch (error) {
        // The caller gets no effect to dispose: stop watching, or the effect would re-run forever
        watcher.unwatch(this);
        throw error;
      }
    }

    /**
     * Runs the effect a first time, synchronously, without watching it, then watches it when the run has read a signal.
     *
     * The computed signal is watched after its evaluation: becoming live, it subscribes to the signals the run read,
     * which did not change meanwhile, so a change of any of them notifies it.
     *
     * @returns `true` when the effect is watched, `false` when the run read no signal.
     * @throws The exception thrown by the run.
     */
    public track(): boolean {
      this.get();
      if (!Signal.subtle.hasSources(this)) {
        return false;
      }

      this._watcher = new Signal.subtle.Watcher(queueWatcher);
      this._watcher.watch(this);
      return true;
    }

    /**
     * Runs the callback between the hooks, which run untracked, so the signals they read are not dependencies of the
     * effect.
     *
     * @throws The exception thrown by the callback or by a hook.
     */
    public run(): void {
      const options = this._options;
      if (options?.onBeforeRun) {
        Signal.subtle.untrack(options.onBeforeRun);
      }

      try {
        this._callback(this._first, this._second, this._third);
      } finally {
        if (options?.onAfterRun) {
          Signal.subtle.untrack(options.onAfterRun);
        }
      }
    }

    /**
     * Disposes the effect: it calls `onCleanup`, then stops watching, severing the dependency chain, so the callback
     * never runs again, also when a run was already queued.
     *
     * @throws When the effect is already disposed.
     */
    public dispose(): void {
      this._options?.onCleanup?.();
      this._watcher!.unwatch(this);
    }
  };
}

/**
 * The computation of the computed signal every effect is: the specification calls it with the computed signal as
 * `this`, the effect itself, so it is declared once for every effect.
 *
 * @param this - The effect.
 * @throws The exception thrown by the callback or by a hook of the effect.
 */
function computeEffect(this: InstanceType<ReturnType<typeof defineEffectClass>>): void {
  this.run();
}
