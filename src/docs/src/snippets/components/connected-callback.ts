export class TimerComponent extends CustomElement {
  public connectedCallback(): void {
    // ✗ Class 'TimerComponent' incorrectly extends base class 'CustomElement'.
    //   Property 'connectedCallback' is private in type 'CustomElement' but not in type 'TimerComponent'.
  }
}
