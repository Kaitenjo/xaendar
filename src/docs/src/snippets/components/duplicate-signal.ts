/**
 * The base class, declaring the input its methods read.
 */
export abstract class CounterBase extends CustomElement {
  /**
   * A signal member, recognized by its type.
   */
  public abstract accessor step: InputSignal<number>;
}

/**
 * The component, declaring the input with its default.
 */
export class StepperComponent extends CounterBase {
  /**
   * ✗ The same signal member, declared again.
   */
  @Property(1)
  public accessor step!: InputSignal<number>;
}

/**
 * ✓ In the base class, a type that is not a signal type.
 */
public abstract accessor step: () => number;
