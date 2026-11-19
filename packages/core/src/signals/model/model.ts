import type { SignalOptions } from '@xaendar/signals';
import type { EventHost } from '../../types/event/event-host.type';
import type { ModelChange } from '../../types/model/model-change.type';
import type { ModelGetter } from '../../types/model/model-getter.type';
import { INPUT_PROTOTYPE } from '../input/input';
import { INITIAL_VALUE } from '../input/input-instance.symbol';
import { INPUT_SIGNAL_SET_SYMBOL } from '../input/input-set.symbol';
import { NODE } from '../node/node.symbol';
import type { ModelSignal } from '../types/model-signal.type';
import { untracked } from '../untracked';
import { MODEL_CHANGE, MODEL_HOST, MODEL_SIGNAL_INSTANCE_SYMBOL } from './model-instance.symbol';

/**
 * The prototype shared by the prototypes of the models (see {@link createModelPrototype}): it extends the one of the
 * inputs, so that a model is an input for the runtime (`get`, `reset`, the mark of the inputs), and replaces `set`,
 * which the framework calls with the internal set symbol and the class declaring the model without it, and adds `update`.
 */
const MODEL_PROTOTYPE = Object.create(INPUT_PROTOTYPE, {
  set: {
    /**
     * Sets the value of the model: quietly when the framework sets it from outside, with the internal set symbol,
     * dispatching the event of change otherwise.
     *
     * @param value - The new value.
     * @param symbol - The internal set symbol, only from the framework.
     */
    value(value: unknown, symbol?: symbol): void {
      symbol === INPUT_SIGNAL_SET_SYMBOL ? this[NODE].set(value) : change(this, value);
    }
  },
  update: {
    /**
     * Sets the value of the model to the one derived from the current value, read untracked, dispatching the event of
     * change.
     *
     * @param updater - Function receiving the current value and returning the next one.
     */
    value(updater: (previous: unknown) => unknown): void {
      const node = this[NODE];
      change(this, updater(untracked(() => node.get())));
    }
  },
  [MODEL_SIGNAL_INSTANCE_SYMBOL]: { value: true }
});

/**
 * Creates the prototype of the models of an accessor, holding what they share: the initial value, which `reset`
 * restores, and the event of change with the equality of the values.
 *
 * N.B. Created once per accessor, by `@Model`, so that a model keeps on its getter only its state and its host. Do not
 * keep the initial value, the name of the event or its options on the getter, nor create the model as an input plus an
 * `Output` (an object and a closure more per instance): a template rendering thousands of components holds a model per
 * instance.
 *
 * @param initialValue - The initial value of the models.
 * @param modelChange - The event of change and the equality of the values.
 * @returns The prototype.
 */
export function createModelPrototype(initialValue: unknown, modelChange: ModelChange): object {
  return Object.create(MODEL_PROTOTYPE, {
    [INITIAL_VALUE]: { value: initialValue },
    [MODEL_CHANGE]: { value: modelChange }
  });
}

/**
 * Creates the `ModelSignal` of an instance: an input its host can write, dispatching the event of change.
 *
 * @param prototype - The prototype of the models of the accessor (see {@link createModelPrototype}).
 * @param host - The component or the directive declaring the model.
 * @param options - The options of the underlying state (`equals`, `watched`, `unwatched`), shared by the models of the accessor.
 * @returns The model, holding the initial value of the prototype.
 */
export function model<Value>(prototype: object, host: EventHost, options: SignalOptions<Value> | undefined): ModelSignal<Value> {
  const signal = new Signal.State<Value>((prototype as Record<typeof INITIAL_VALUE, Value>)[INITIAL_VALUE], options);
  const getter = () => signal.get();
  getter[NODE] = signal;
  getter[MODEL_HOST] = host;
  return Object.setPrototypeOf(getter, prototype);
}

/**
 * Writes a value into a model from the class declaring it: when it differs from the current one, the value is set and
 * the event of change dispatched on the host, the value as its `detail`.
 *
 * @param model - The model.
 * @param value - The new value.
 */
function change(model: ModelGetter, value: unknown): void {
  const node = model[NODE];
  const { name, event, equals } = model[MODEL_CHANGE];
  if (equals.call(node as unknown as ThisParameterType<typeof equals>, untracked(() => node.get()), value)) {
    return;
  }

  node.set(value);
  model[MODEL_HOST].dispatchEvent(new CustomEvent(name, { bubbles: event?.bubbles, cancelable: event?.cancelable, composed: event?.composed, detail: value }));
}
