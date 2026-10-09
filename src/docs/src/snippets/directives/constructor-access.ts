/**
 * A directive doing its setup too early.
 */
@Directive({ selector: 'exEarly' })
export class EarlyDirective extends CustomDirective<HTMLElement> {
  /**
   * ✗ Reads the element and creates an effect before they are available.
   */
  public constructor() {
    super();
    console.log(this.element); // undefined: the element is set after the constructor
    this.effect(() => {});     // TypeError: Cannot read properties of undefined (reading 'addUnlistener')
  }

  /**
   * ✓ Here the element, the inputs and the context are all in place.
   */
  public onInit(): void {
    this.effect(() => {});
  }
}
