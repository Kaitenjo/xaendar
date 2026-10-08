export class ClockComponent extends CustomElement {
  public readonly now = signal(new Date());
  private timer = 0;

  public constructor() {
    super();                 // once per element: the shadow root exists, the template is not rendered
  }

  public onInit(): void {    // at every connection, before the render
    this.timer = setInterval(() => this.now.set(new Date()), 1000);
    this.effect(() => document.title = this.now().toLocaleTimeString());
  }

  public afterRender(): void {
    // at every connection, after the render: the elements of the template and the view queries are there
  }

  public onDestroy(): void { // at every disconnection, before the template is removed
    clearInterval(this.timer);
    // the effects created with this.effect() are disposed right after, with no code of yours
  }
}
