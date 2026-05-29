import { SignalOptions } from '@xaendar/signals';
import { assertPrivateContext } from './input-set.symbol';

/**
 * An `InputSignal` is a specialized `Signal.State` designed for use as a property signal in web components. 
 * It extends the base `State` signal with additional functionality to handle incoming values, such as those from HTML attributes or external sources, 
 * and allows for optional transformation of these values before they are stored in the signal.
 */
export class InputSignal<ActualValue = unknown, IncomingValue = ActualValue> extends Signal.State<ActualValue>{
  /**
   * Optional transform function to convert incoming values to the actual type stored in the signal.
   */
  private _transform?: (value: IncomingValue) => ActualValue;

  /**
   * Creates a new `InputSignal` instance.
   *
   * @param initialValue - The initial value of the signal.
   * @param options - Optional configuration:
   *   - `equals` — custom equality function; defaults to `Object.is`.
   *   - `watched` — called when the signal gains its first sink.
   *   - `unwatched` — called when the signal loses its last sink.
   *   - `transform` — function to transform incoming values before setting the signal's value.
   */
  constructor(value?: ActualValue, options?: SignalOptions<ActualValue> & { transform?: (value: IncomingValue) => ActualValue }) {
    const transform = options?.transform;
    /* 
      Ensure transform field is not passed to super constructor
      since it's not part of SignalOptions and would cause an error
    */
    delete options?.transform;

    super(value as ActualValue, options);
    this._transform = transform;
  }

  /**
   * Set a new value to the signal, applying the transform function if provided.
   * @param newValue - The new value to set.
   * @throws If `frozen` is `true` — writes are forbidden while a protected
   * callback is executing.
   */
  // @ts-expect-error
  public override set(newValue: IncomingValue, symbol: symbol): void {
    assertPrivateContext(symbol);
    const transformedValue = this._transform ? this._transform(newValue) : newValue;
    super.set(transformedValue as ActualValue);
  }
}
