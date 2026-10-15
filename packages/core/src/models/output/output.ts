import type { VoidFunction } from '@xaendar/types';
import type { EventOptions } from '../event-options/event-options';

/**
 * The output declared by an `@Event` accessor of a web component or a custom directive.
 *
 * The `emit` function dispatches a `CustomEvent` with the specified value and
 * options. Any options passed to `emit` override the defaults configured in
 * the decorator.
 *
 * It is a class, not just a type, so that the runtime can tell an output from any other member by `instanceof`,
 * as it does to expose the outputs of a host directive.
 *
 * @template Value - The type of the value to emit as the event detail. Defaults to `void`.
 */
export class Output<Value = void> {
  /**
   * Creates the output.
   *
   * @param emit - Dispatches the event: with the detail, when the output has one, followed by the options of the emission.
   */
  constructor(public emit: VoidFunction<Value extends void ? ([EventOptions] | []) : ([Value, EventOptions] | [Value])>) { }
}
