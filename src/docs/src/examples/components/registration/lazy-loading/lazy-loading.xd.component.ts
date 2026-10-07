import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * Loads the module of a component on demand, after a template using it has already been rendered.
 */
@WebComponent({
  selector: 'ex-lazy-loading',
  templateUrl: './lazy-loading.xd.component.html',
  styleUrl: './lazy-loading.css'
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
   * The attributes of the first panel, as they are in the DOM.
   */
  public readonly attributes = signal('');

  /**
   * The first panel, rendered before its definition is loaded.
   */
  @Query('ex-lazy-panel')
  public accessor early!: QuerySignal<HTMLElement | null>;

  /**
   * The module may have been loaded already, by a previous visit of this page.
   */
  public afterRender(): void {
    this.loaded.set(customElements.get('ex-lazy-panel') !== undefined);
    this.readAttributes();
  }

  /**
   * Changes the bound value.
   */
  public increment(): void {
    this.count.update(count => count + 1);
    setTimeout(() => this.readAttributes());
  }

  /**
   * Imports the module of the panel: its `@WebComponent` decorator defines it, upgrading the panel already in the page.
   */
  public async load(): Promise<void> {
    await import('./lazy-panel.lazy.xd.component');
    this.loaded.set(true);
    this.readAttributes();
  }

  /**
   * Reads the attributes of the first panel.
   */
  private readAttributes(): void {
    const attributes = [...this.early()?.attributes ?? []];
    this.attributes.set(attributes.map(({ name, value }) => `${name}="${value}"`).join(' ') || 'none');
  }
}
