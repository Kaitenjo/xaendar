import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';
import { translations } from '../../core/i18n/i18n';
import { navigate } from '../../core/router/router';
import { pageTitle, searchPages } from '../../core/routes/routes';
import type * as ApiData from '../../pages/reference/api/api.data';

/**
 * A result of the search: a page, or a symbol of the API reference.
 */
type SearchResult = {
  /**
   * The path of the page displaying it.
   */
  readonly path: string;
  /**
   * The title of the page, or the name of the symbol.
   */
  readonly title: string;
  /**
   * The path of the page, or the kind and the package of the symbol.
   */
  readonly detail: string;
};

/**
 * Searches the pages of the documentation by title and keywords, and the symbols of the API reference by name and
 * package. Pressing `/` anywhere focuses it.
 */
@WebComponent({
  selector: 'docs-search',
  styleUrl: './docs-search.xd.component.css',
  templateUrl: './docs-search.xd.component.html'
})
export class DocsSearchComponent extends CustomElement {
  /**
   * The search field.
   */
  @Query<HTMLInputElement>('input')
  public accessor input!: QuerySignal<HTMLInputElement | null>;
  /**
   * The text typed by the reader.
   */
  public readonly query = signal('');
  /**
   * Whether the results are shown.
   */
  public readonly expanded = signal(false);
  /**
   * The index of the highlighted result.
   */
  public readonly active = signal(0);
  /**
   * The symbols named exactly as the query, then the pages matching it, then the other symbols matching it.
   */
  public readonly results = computed(() => this._computeResults());
  /**
   * The data of the API reference, `undefined` until its module is loaded: it is loaded the first time the field is
   * used, not with the top bar.
   */
  private readonly _apiData = signal<typeof ApiData | undefined>(undefined);
  /**
   * Focuses the search field when `/` is pressed outside of a text field.
   */
  private readonly _onShortcut = (event: KeyboardEvent): void => {
    const target = event.composedPath()[0];
    const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (event.key === '/' && !typing) {
      event.preventDefault();
      this.input()?.focus();
    }
  };

  /**
   * Starts listening to the keyboard shortcut.
   */
  public onInit(): void {
    document.addEventListener('keydown', this._onShortcut);
  }

  /**
   * Updates the query as the reader types.
   *
   * @param event - The `input` event of the search field.
   */
  public onInput(event: Event): void {
    this._loadApiData();
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
    this.expanded.set(true);
  }

  /**
   * Moves through the results with the arrow keys, opens one with Enter, closes them with Escape.
   *
   * @param event - The `keydown` event of the search field.
   */
  public onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.active.set(count ? (this.active() + 1) % count : 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.active.set(count ? (this.active() - 1 + count) % count : 0);
        break;
      case 'Enter': {
        const result = this.results()[this.active()];
        if (result) {
          this.go(result.path);
        }
        break;
      }
      case 'Escape':
        this._reset();
        break;
    }
  }

  /**
   * Shows the results again when the field is focused.
   */
  public open(): void {
    this._loadApiData();
    this.expanded.set(true);
  }

  /**
   * Hides the results when the field loses the focus.
   */
  public close(): void {
    this.expanded.set(false);
  }

  /**
   * Displays a page and clears the search.
   *
   * @param target - The path of the page.
   */
  public go(target: string): void {
    navigate(target);
    this._reset();
  }

  /**
   * Loads the data of the API reference, once.
   */
  private _loadApiData(): void {
    if (!this._apiData()) {
      import('../../pages/reference/api/api.data').then(module => this._apiData.set(module));
    }
  }

  /**
   * Computes the value of `results`.
   *
   * @returns The symbols named exactly as the query, then the pages matching it, then the other symbols matching it.
   */
  private _computeResults(): SearchResult[] {
    const query = this.query();
    const messages = translations();
    const results: SearchResult[] = searchPages(query, messages).map(page => ({ path: page.path, title: pageTitle(page, messages), detail: page.path }));
    const apiData = this._apiData();
    const symbols = apiData?.searchSymbols(query);
    if (!apiData || !symbols?.length) {
      return results;
    }

    const exact = query.trim().toLowerCase();
    let exactCount = 0;
    for (let i = 0; i < symbols.length; i++) {
      const { apiPackage, symbol } = symbols[i];
      const result = { path: apiData.symbolPath(apiPackage.name, symbol.name), title: symbol.name, detail: `${messages.reference.kinds[symbol.kind]} · ${apiPackage.name}` };
      if (symbol.name.toLowerCase() === exact) {
        results.splice(exactCount++, 0, result);
      } else {
        results.push(result);
      }
    }
    return results;
  }

  /**
   * Clears the search and leaves the field.
   */
  private _reset(): void {
    const input = this.input();
    if (input) {
      // The value is a property of the field: binding the "value" attribute would not clear what was typed
      input.value = '';
      input.blur();
    }
    this.query.set('');
    this.expanded.set(false);
  }

  /**
   * Stops listening to the keyboard shortcut.
   */
  public onDestroy(): void {
    document.removeEventListener('keydown', this._onShortcut);
  }
}
