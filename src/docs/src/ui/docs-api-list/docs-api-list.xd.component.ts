import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import { translations } from '../../core/i18n/i18n';
import { lang } from '../../core/router/router';
import { API } from '../../pages/reference/api/api.data';
import type { ApiEntry } from '../../pages/reference/api/api.data';

/**
 * The searchable list of the exports of the packages.
 */
@WebComponent({
  selector: 'docs-api-list',
  templateUrl: './docs-api-list.xd.component.html',
  styleUrl: '../reference-list.css'
})
export class DocsApiListComponent extends CustomElement {
  /**
   * The texts of the user interface.
   */
  public readonly translations = translations;
  /**
   * The language of the links.
   */
  public readonly currentLang = lang;
  /**
   * The modules offered by the filter.
   */
  public readonly modules = [...new Set(API.map(entry => entry.module))];
  /**
   * The text typed in the filter.
   */
  public readonly query = signal('');
  /**
   * The module chosen, or an empty string for every module.
   */
  public readonly module = signal('');
  /**
   * The entries matching the filters, with their texts in the current language.
   */
  public readonly entries = computed(() => this._computeEntries());

  /**
   * Stores the text typed in the filter.
   *
   * @param event - The input event of the field.
   */
  public search(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /**
   * Stores the module chosen.
   *
   * @param event - The change event of the select.
   */
  public pickModule(event: Event): void {
    this.module.set((event.target as HTMLSelectElement).value);
  }

  /**
   * Computes the value of `entries`.
   *
   * @returns The entries matching the filters, with their texts in the current language.
   */
  private _computeEntries(): Array<ApiEntry & { text: string; href: string }> {
    const query = this.query().trim().toLowerCase();
    const module = this.module();
    const current = this.currentLang();
    const descriptions = this.translations().api;
    return API
      .filter(entry => !module || entry.module === module)
      .map(entry => ({ ...entry, text: descriptions[entry.name], href: `#/${current}/${entry.page}` }))
      .filter(entry => !query || `${entry.name} ${entry.signature} ${entry.text}`.toLowerCase().includes(query));
  }
}
