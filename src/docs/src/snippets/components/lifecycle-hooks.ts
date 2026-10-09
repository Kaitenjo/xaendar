/**
 * A clock writing the time in the title of the page.
 */
export class ClockComponent extends CustomElement {
  /**
   * The current time.
   */
  public readonly now = signal(new Date());
  /**
   * The interval updating the time.
   */
  private _timer = 0;

  /**
   * Runs once per element: the shadow root exists, the template is not rendered.
   */
  public constructor() {
    super();
  }

  /**
   * Runs at every connection, before the render.
   */
  public onInit(): void {
    this._timer = setInterval(() => this.now.set(new Date()), 1000);
    this.effect(() => document.title = this.now().toLocaleTimeString());
  }

  /**
   * Runs at every connection, after the render: the elements of the template and the view queries are there.
   */
  public afterRender(): void {}

  /**
   * Runs at every disconnection, before the template is removed. The effects created with this.effect()
   * are disposed right after, with no code of yours.
   */
  public onDestroy(): void {
    clearInterval(this._timer);
  }
}
