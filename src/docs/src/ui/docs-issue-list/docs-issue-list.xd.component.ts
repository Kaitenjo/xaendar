import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import { translations } from '../../core/i18n/i18n';
import { lang } from '../../core/router/router';
import { ISSUES } from '../../pages/reference/known-issues/known-issues.data';
import type { IssueEntry } from '../../pages/reference/known-issues/known-issues.data';

/**
 * The searchable list of the known issues.
 */
@WebComponent({
  selector: 'docs-issue-list',
  templateUrl: './docs-issue-list.xd.component.html',
  styleUrl: '../reference-list.css'
})
export class DocsIssueListComponent extends CustomElement {
  /**
   * The texts of the user interface.
   */
  public readonly translations = translations;
  /**
   * The language of the links.
   */
  public readonly currentLang = lang;
  /**
   * The areas offered by the filter.
   */
  public readonly areas = [...new Set(ISSUES.map(entry => entry.area))];
  /**
   * The text typed in the filter.
   */
  public readonly query = signal('');
  /**
   * The area chosen, or an empty string for every area.
   */
  public readonly area = signal('');
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
   * Stores the area chosen.
   *
   * @param event - The change event of the select.
   */
  public pickArea(event: Event): void {
    this.area.set((event.target as HTMLSelectElement).value);
  }

  /**
   * Computes the value of `entries`.
   *
   * @returns The entries matching the filters, with their texts in the current language.
   */
  private _computeEntries(): Array<IssueEntry & { titleText: string; detailsText: string; workaroundText: string; href: string }> {
    const query = this.query().trim().toLowerCase();
    const area = this.area();
    const current = this.currentLang();
    const texts = this.translations().issues;
    return ISSUES
      .filter(entry => !area || entry.area === area)
      .map(entry => ({
        ...entry,
        titleText: texts[entry.id].title,
        detailsText: texts[entry.id].details,
        workaroundText: texts[entry.id].workaround,
        href: `#/${current}/${entry.page}`
      }))
      .filter(entry => !query || `${entry.titleText} ${entry.detailsText} ${entry.workaroundText}`.toLowerCase().includes(query));
  }
}
