import type { SignalEqual } from '@xaendar/signals';
import type { ModelDecoratorOptions } from './model-decorator-options.type';

/**
 * What every model of an accessor shares, kept once on the prototype of its models: the event dispatched when one of
 * them changes its value, and the equality telling whether it does.
 */
export type ModelChange = {
  /**
   * The name of the event of change: the name the model is bound with followed by `Change`.
   */
  readonly name: string;
  /**
   * The options the event of change is dispatched with, `undefined` for the defaults of a `CustomEvent`.
   */
  readonly event: ModelDecoratorOptions['event'];
  /**
   * Compares the current value with the new one: the event is dispatched only when they differ.
   */
  readonly equals: SignalEqual<unknown>;
};
