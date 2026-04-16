import { VoidFunction } from '@xaendar/common';
import { EventParams } from './event-params.type';

/**
 * Rapresent the output type returned by an @Event Decorator in a Web Component.
 * 
 * Function type `emit` can be used to emit the event with the specified value and options.
 * @param Value - The type of the value to be emitted with the event. Default is `void`.
 * @param EventParams - The type of the event parameters to configure the event emission.
 * This object's properties override the default event parameters defined in the decorator.
 */
export type Output<Value = void> = {
  emit: VoidFunction<Value extends void ? ([EventParams] | []) : ([Value, EventParams] | [Value])>;
}