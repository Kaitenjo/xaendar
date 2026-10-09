/**
 * A component trying to run code at every connection by overriding the callback of the browser.
 */
export class TimerComponent extends CustomElement {
  /**
   * Overrides the connection callback, which CustomElement keeps private: use onInit instead.
   */
  public connectedCallback(): void {
    // ✗ Class 'TimerComponent' incorrectly extends base class 'CustomElement'.
    //   Property 'connectedCallback' is private in type 'CustomElement' but not in type 'TimerComponent'.
  }
}
