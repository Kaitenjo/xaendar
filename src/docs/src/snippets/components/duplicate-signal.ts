export abstract class CounterBase extends CustomElement {
  public abstract accessor step: InputSignal<number>;   // a signal member, recognized by its type
}

export class StepperComponent extends CounterBase {
  @Property(1)
  public accessor step!: InputSignal<number>;           // ✗ the same signal member, declared again
}

// ✓ in the base class, use a type that is not a signal type
public abstract accessor step: () => number;
