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
   * A source.
   */
  private readonly price = new Signal.State(10);

  /**
   * Another source.
   */
  private readonly quantity = new Signal.State(2);

  /**
   * Whether `currentComputed()` returned `total` itself while `total` was computing.
   */
  private sawItself = false;

  /**
   * Derived from both sources.
   */
  private readonly total = new Signal.Computed(() => {
    this.sawItself = Signal.subtle.currentComputed() === this.total;
    return this.price.get() * this.quantity.get();
  });

  /**
   * A watcher, to make the graph live.
   */
  private readonly watcher = new Signal.subtle.Watcher(() => {});

  /**
   * The rows of the report.
   */
  public readonly rows = signal<Array<{ call: string; result: string }>>([]);

  /**
   * Reports the initial state of the graph, once the page has rendered: during the render a
   * computation may be in progress (see the known issues about untracked).
   */
  public onInit(): void {
    queueMicrotask(() => this.report());
  }

  /**
   * Reads `total`, which records its sources.
   */
  public read(): void {
    this.total.get();
    this.report();
  }

  /**
   * Watches `total`: the sources now know their sink.
   */
  public watch(): void {
    if (!Signal.subtle.hasSinks(this.total)) {
      this.watcher.watch(this.total);
    }
    this.report();
  }

  /**
   * Stops watching `total`.
   */
  public unwatch(): void {
    if (Signal.subtle.hasSinks(this.total)) {
      this.watcher.unwatch(this.total);
    }
    this.report();
  }

  /**
   * Stops watching when the component leaves the page.
   */
  public onDestroy(): void {
    this.unwatch();
  }

  /**
   * Refreshes the report.
   */
  private report(): void {
    this.rows.set([
      { call: 'introspectSources(total).length', result: String(Signal.subtle.introspectSources(this.total).length) },
      { call: 'hasSources(total)', result: String(Signal.subtle.hasSources(this.total)) },
      { call: 'introspectSinks(price).length', result: String(Signal.subtle.introspectSinks(this.price).length) },
      { call: 'hasSinks(total)', result: String(Signal.subtle.hasSinks(this.total)) },
      { call: 'introspectSources(watcher).length', result: String(Signal.subtle.introspectSources(this.watcher).length) },
      { call: 'currentComputed() inside total', result: String(this.sawItself) },
      { call: 'currentComputed() outside', result: String(Signal.subtle.currentComputed()) }
    ]);
  }
}
