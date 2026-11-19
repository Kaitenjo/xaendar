import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Loads the module of a component on demand, after a template using it has already been rendered.
 */
@WebComponent({
  selector: 'ex-lazy-loading',
  styleUrl: './lazy-loading.css',
  templateUrl: './lazy-loading.xd.component.html'
})
export class LazyLoadingComponent extends CustomElement {
  /**
   * The value bound to both panels.
   */
  public readonly count = signal(1);
  /**
   * Whether `ex-lazy-panel` is defined.
   */
  public readonly loaded = signal(false);
  /**
   * The values of the bindings the first panel holds in its properties, until its class reads them.
   */
  public readonly heldProp = signal('');
  /**
   * The first panel, rendered before its definition is loaded.
   */
  @Query('ex-lazy-panel')
  public accessor early!: QuerySignal<HTMLElement | null>;

  /**
   * The inputs of the panel, which the template binds.
   */
  private readonly _inputs = ['count', 'label'];

  /**
   * The module may have been loaded already, by a previous visit of this page.
   */
  public afterRender(): void {
    this.loaded.set(customElements.get('ex-lazy-panel') !== undefined);
    this._readHeld();
  }

  /**
   * Changes the bound value.
   */
  public increment(): void {
    this.count.update(count => count + 1);
    setTimeout(() => this._readHeld());
  }

  /**
   * Imports the module of the panel: its `@WebComponent` decorator defines it, upgrading the panel already in the page.
   */
  public async load(): Promise<void> {
    await import('./lazy-panel.lazy.xd.component');
    this.loaded.set(true);
    this._readHeld();
  }

  /**
   * Reads the values the first panel holds in its own properties: the inputs of the panel read them, and remove them,
   * once its class is defined.
   */
  private _readHeld(): void {
    const panel = this.early() as unknown as Record<string, unknown> | null;
    const held = panel ? this._inputs.filter(name => Object.hasOwn(panel, name)).map(name => `${name}=${JSON.stringify(panel[name])}`) : undefined;
    this.heldProp.set(held?.length ? held.join(' ') : 'nothing');
  }
}
