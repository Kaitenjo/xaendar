/**
 * A directive doing its setup too early.
 */
@Directive({ selector: 'exEarly' })
export class EarlyDirective extends CustomDirective<HTMLElement> {
  /**
   * ✗ Reads the element before it is set.
   */
  public constructor() {
    super();
    console.log(this.element); // undefined: the element is set after the constructor
    this.effect(() => {});     // ✓ allowed: the effect is disposed with the directive
  }

  /**
   * ✓ Here the element, the inputs and the context are all in place.
   */
  public onInit(): void {
    console.log(this.element);
  }
}
