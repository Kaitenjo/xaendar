import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import { href } from '../../core/router/router';
import { API, symbolPath } from '../../pages/reference/api/api.data';
import type { ApiKind, ApiPackage, ApiSymbol } from '../../pages/reference/api/api.data';

/**
 * The index of the API reference: the symbols of every package, in columns, linked to their pages. A filter narrows
 * them by name and by kind.
 */
@WebComponent({
  selector: 'docs-api-index',
  styleUrl: './docs-api-index.xd.component.css',
  templateUrl: './docs-api-index.xd.component.html'
})
export class DocsApiIndexComponent extends CustomElement {
  /**
   * The kinds offered by the filter.
   */
  public readonly kinds: readonly ApiKind[] = ['decorator', 'class', 'function', 'type', 'global'];
  /**
   * The text typed in the filter.
   */
  public readonly query = signal('');
  /**
   * The kind chosen, or an empty string for every kind.
   */
  public readonly kind = signal('');
  /**
   * The packages with at least a symbol matching the filters, with those symbols only, sorted by name.
   */
  public readonly packages = computed(() => this._computePackages());

  /**
   * Stores the text typed in the filter.
   *
   * @param event - The input event of the field.
   */
  public search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /**
   * Stores the kind chosen.
   *
   * @param event - The change event of the select.
   */
  public pickKind(event: Event): void {
    this.kind.set((event.target as HTMLSelectElement).value);
  }

  /**
   * Computes the value of `packages`.
   *
   * @returns The packages with at least a symbol matching the filters, with those symbols and their links.
   */
  private _computePackages(): Array<Pick<ApiPackage, 'name'> & { symbols: Array<ApiSymbol & { href: string }> }> {
    const query = this.query().trim().toLowerCase();
    const kind = this.kind();
    return API
      .map(apiPackage => ({
        name: apiPackage.name,
        symbols: apiPackage.symbols
          .filter(symbol => (!kind || symbol.kind === kind) && (!query || symbol.name.toLowerCase().includes(query)))
          .sort((left, right) => left.name.localeCompare(right.name, 'en', { sensitivity: 'base' }))
          .map(symbol => ({ ...symbol, href: href(symbolPath(apiPackage.name, symbol.name)) }))
      }))
      .filter(apiPackage => apiPackage.symbols.length);
  }
}
