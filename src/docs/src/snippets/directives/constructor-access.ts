@Directive({ selector: 'exEarly' })
export class EarlyDirective extends CustomDirective<HTMLElement> {
  public constructor() {
    super();
    console.log(this.element); // undefined: the element is set after the constructor
    this.effect(() => {});     // TypeError: Cannot read properties of undefined (reading 'addUnlistener')
  }

  public onInit(): void {
    this.effect(() => {});     // Here the element, the inputs and the context are all in place
  }
}
