import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import { loadPage, pageOf, preloadedPage } from '../../core/pages/pages';
import { path } from '../../core/router/router';

/**
 * Renders the page being read: a `@switch` on the page of the path picks its component. The module of a page is loaded
 * before its element is rendered, so the bindings reach its inputs; the previous page stays in place until then.
 * Pages are not rendered again when the language changes: their texts follow it on their own, and neither is the page
 * of the symbols when another symbol is displayed.
 */
@WebComponent({
  selector: 'docs-outlet',
  templateUrl: './docs-outlet.xd.component.html'
})
export class DocsOutletComponent extends CustomElement {
  /**
   * The path of the page whose module is loaded and which is displayed, from the first render when it was loaded
   * before the outlet was created (see `loadInitialPage`).
   */
  public readonly ready = signal<string | undefined>(preloadedPage());
  /**
   * The page displaying the path whose module is loaded.
   */
  public readonly page = computed(() => this._computePage());

  /**
   * Loads the page of the current path, and displays it.
   */
  public onInit(): void {
    this.effect(() => {
      const target = path();
      untracked(() => this._display(target));
    });
  }

  /**
   * Loads the module of a page and, unless the reader moved on in the meantime, displays it.
   *
   * @param target - The path of the page.
   */
  private async _display(target: string): Promise<void> {
    await loadPage(target);
    if (path() === target) {
      this.ready.set(target);
    }
  }

  /**
   * Computes the value of `page`.
   *
   * @returns The page displaying the path whose module is loaded, `undefined` until the first one is.
   */
  private _computePage(): string | undefined {
    const ready = this.ready();
    return ready === undefined ? undefined : pageOf(ready);
  }
}
