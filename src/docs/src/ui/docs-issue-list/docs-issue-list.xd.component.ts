import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { Computed } from '@xaendar/core/signals';
import { t } from '../../core/i18n/i18n';
import type { Messages } from '../../core/i18n/messages';
import { lang } from '../../core/router/router';
import type { Lang } from '../../core/router/route-hash.utils';
import { ISSUES } from '../../pages/reference/known-issues/known-issues.data';

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
  public readonly t: Computed<Messages> = t;

  /**
   * The language of the texts.
   */
  public readonly currentLang: Computed<Lang> = lang;

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
  public readonly entries = computed(() => {
    const query = this.query().trim().toLowerCase();
    const area = this.area();
    const current = this.currentLang();
    return ISSUES
      .filter(entry => !area || entry.area === area)
      .map(entry => ({
        ...entry,
        titleText: entry.title[current],
        detailsText: entry.details[current],
        workaroundText: entry.workaround[current],
        href: `#/${current}/${entry.page}`
      }))
      .filter(entry => !query || `${entry.titleText} ${entry.detailsText} ${entry.workaroundText}`.toLowerCase().includes(query));
  });

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
}
