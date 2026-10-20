import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `connected-callback.ts`, shown by the page components/lifecycle and the API reference of core.
 */
export const CONNECTED_CALLBACK: SourceFile = {
  name: 'connected-callback.ts',
  lang: 'ts',
  code: `/**
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
}`
};

/**
 * The snippet `lifecycle-hooks.ts`, shown by the page components/lifecycle and the API reference of core.
 */
export const LIFECYCLE_HOOKS: SourceFile = {
  name: 'lifecycle-hooks.ts',
  lang: 'ts',
  code: `/**
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
}`
};
