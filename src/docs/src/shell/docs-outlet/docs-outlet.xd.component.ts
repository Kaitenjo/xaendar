import { CustomElement, WebComponent } from '@xaendar/core';
import { signal, untracked } from '@xaendar/core/signals';
import { path } from '../../core/router/router';

/**
 * The module of every page, loaded on demand: a page brings along the components and directives its template
 * imports, and nothing else. The switch button is left out: the top bar imports it.
 */
const PAGE_MODULES = import.meta.glob(['../../pages/**/*.xd.component.ts', '!../../pages/components/switch-button/**']);

/**
 * Finds the loader of the module of a page.
 *
 * @param target - The path of the page, `''` for the home page.
 * @returns The loader, `undefined` if no page has that path.
 */
function findPageLoader(target: string): (() => Promise<unknown>) | undefined {
  const folder = target === '' ? 'home' : target;
  return PAGE_MODULES[`../../pages/${folder}/${folder.slice(folder.lastIndexOf('/') + 1)}.xd.component.ts`];
}

/**
 * Renders the page being read: a `@switch` on the path picks its component. The module of a page is loaded
 * before its element is rendered, so the bindings reach its inputs; the previous page stays in place until then.
 * Pages are not rendered again when the language changes: their texts follow it on their own.
 */
@WebComponent({
  selector: 'docs-outlet',
  templateUrl: './docs-outlet.xd.component.html'
})
export class DocsOutletComponent extends CustomElement {
  /**
   * The path of the page whose module is loaded and which is displayed.
   */
  public readonly ready = signal<string | undefined>(undefined);

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
    // A path with no page is the not found page, loaded on demand like the others
    const loader = findPageLoader(target) ?? findPageLoader('not-found');
    await loader?.();
    if (path() === target) {
      this.ready.set(target);
    }
  }
}
