import type { MODEL_CHANGE, MODEL_HOST } from '../../signals/model/model-instance.symbol';
import type { NODE } from '../../signals/node/node.symbol';
import type { ModelSignal } from '../../signals/types/model-signal.type';
import type { EventHost } from '../event/event-host.type';
import type { ModelChange } from './model-change.type';

/**
 * The getter of a model, with what it keeps: its state and its host on itself, what the models of its accessor share
 * on its prototype.
 */
export type ModelGetter = ModelSignal & {
  /**
   * The underlying state.
   */
  readonly [NODE]: Signal.State<unknown>;
  /**
   * The component or the directive declaring the model.
   */
  readonly [MODEL_HOST]: EventHost;
  /**
   * The event of change and the equality of the values, from the prototype of the models of the accessor.
   */
  readonly [MODEL_CHANGE]: ModelChange;
};
