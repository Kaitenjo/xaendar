import type { AttributeNode } from './nodes/attribute-node.type';
import type { EventNode } from './nodes/event-node.type';

/**
 * The two bindings a two-way binding, `[(value)]="signal"`, stands for.
 */
export type TwoWayBinding = {
  /**
   * The input, bound to the value of the signal: `value="{signal()}"`.
   */
  readonly attribute: AttributeNode;
  /**
   * The listener of the event of change of the input, writing its detail into the signal:
   * `(valueChange)="signal.set($event.detail)"`.
   */
  readonly event: EventNode;
};
