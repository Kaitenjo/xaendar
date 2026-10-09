import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Inspects a tiny graph — price → total ← quantity — with the Signal.subtle introspection API.
 */
@WebComponent({
  selector: 'ex-signal-introspection',
  templateUrl: './introspection.xd.component.html',
  styleUrl: './introspection.css'
})
export class SignalIntrospectionComponent extends CustomElement {
  /**
   * The rows of the report.
   */
  public readonly rows = signal<Array<{ call: string; result: string }>>([]);
  /**
   * A source.
   */
  private readonly _price = new Signal.State(10);
  /**
   * Another source.
   */
  private readonly _quantity = new Signal.State(2);
  /**
   * Whether `currentComputed()` returned `total` itself while `total` was computing.
   */
  private _sawItself = false;
  /**
   * Derived from both sources.
   */
  private readonly _total = new Signal.Computed(() => {
    this._sawItself = Signal.subtle.currentComputed() === this._total;
    return this._price.get() * this._quantity.get();
  });
  /**
   * A watcher, to make the graph live.
   */
  private readonly _watcher = new Signal.subtle.Watcher(() => {});

  /**
   * Reports the initial state of the graph, once the page has rendered: during the render a
   * computation may be in progress (see the known issues about untracked).
   */
  public onInit(): void {
    queueMicrotask(() => this._report());
  }

  /**
   * Reads `total`, which records its sources.
   */
  public read(): void {
    this._total.get();
    this._report();
  }

  /**
   * Watches `total`: the sources now know their sink.
   */
  public watch(): void {
    if (!Signal.subtle.hasSinks(this._total)) {
      this._watcher.watch(this._total);
    }
    this._report();
  }

  /**
   * Stops watching `total`.
   */
  public unwatch(): void {
    if (Signal.subtle.hasSinks(this._total)) {
      this._watcher.unwatch(this._total);
    }
    this._report();
  }

  /**
   * Refreshes the report.
   */
  private _report(): void {
    this.rows.set([
      { call: 'introspectSources(total).length', result: String(Signal.subtle.introspectSources(this._total).length) },
      { call: 'hasSources(total)', result: String(Signal.subtle.hasSources(this._total)) },
      { call: 'introspectSinks(price).length', result: String(Signal.subtle.introspectSinks(this._price).length) },
      { call: 'hasSinks(total)', result: String(Signal.subtle.hasSinks(this._total)) },
      { call: 'introspectSources(watcher).length', result: String(Signal.subtle.introspectSources(this._watcher).length) },
      { call: 'currentComputed() inside total', result: String(this._sawItself) },
      { call: 'currentComputed() outside', result: String(Signal.subtle.currentComputed()) }
    ]);
  }

  /**
   * Stops watching when the component leaves the page.
   */
  public onDestroy(): void {
    this.unwatch();
  }
}
