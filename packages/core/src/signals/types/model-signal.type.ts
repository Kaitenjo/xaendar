import type { InputSignal } from './input-signal.type';

/**
 * The signal of a model, the input of a two-way binding: an {@link InputSignal} the component or the directive declaring
 * it can also write.
 *
 * The bindings of the parent (`value="{…}"`, `[(value)]="…"`), `createComponent` and `renderToString` set it as any
 * input, quietly. `set` and `update`, called by the class declaring it, change the value and, when it differs from the
 * current one, dispatch on the host element the event of change, named after the model followed by `Change`
 * (`valueChange`), whose `detail` is the new value: a two-way binding writes it back into the signal of the parent.
 *
 * @template Value - The type of the value, the same from outside and inside: a model has no `transform`.
 */
export type ModelSignal<Value = unknown> = InputSignal<Value> & {
  /**
   * Sets the value of the model, dispatching the event of change when it differs from the current one.
   *
   * @param value - The new value.
   */
  set(value: Value): void;
  /**
   * Sets the value of the model to the one derived from the current value, dispatching the event of change when it
   * differs from the current one.
   *
   * @param updater - Function receiving the current value and returning the next one.
   */
  update(updater: (previous: Value) => Value): void;
};
