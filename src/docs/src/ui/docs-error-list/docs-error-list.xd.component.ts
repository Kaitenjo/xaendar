import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { Computed } from '@xaendar/core/signals';
import { t } from '../../core/i18n/i18n';
import type { Messages } from '../../core/i18n/messages';
import { lang } from '../../core/router/router';
import type { Lang } from '../../core/router/route-hash.utils';
import { ERRORS } from '../../pages/reference/errors/errors.data';

/**
 * The searchable list of the messages of the compiler, the build, the runtime and the CLI.
 */
@WebComponent({
  selector: 'docs-error-list',
  templateUrl: './docs-error-list.xd.component.html',
  styleUrl: '../reference-list.css'
})
export class DocsErrorListComponent extends CustomElement {
  /**
   * The texts of the user interface.
   */
  public readonly t: Computed<Messages> = t;

  /**
   * The language of the explanations.
   */
  public readonly currentLang: Computed<Lang> = lang;

  /**
   * The phases offered by the filter, in pipeline order.
   */
  public readonly phases = [...new Set(ERRORS.map(entry => entry.phase))];

  /**
   * The text typed in the filter.
   */
  public readonly query = signal('');

  /**
   * The phase chosen, or an empty string for every phase.
   */
  public readonly phase = signal('');

  /**
   * The entries matching the filters, with their texts in the current language.
   */
  public readonly entries = computed(() => {
    const query = this.query().trim().toLowerCase();
    const phase = this.phase();
    const current = this.currentLang();
    return ERRORS
      .filter(entry => !phase || entry.phase === phase)
      .map(entry => ({ ...entry, causeText: entry.cause[current], fixText: entry.fix[current], href: `#/${current}/${entry.page}` }))
      .filter(entry => !query || `${entry.message} ${entry.causeText} ${entry.fixText}`.toLowerCase().includes(query));
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
   * Stores the phase chosen.
   *
   * @param event - The change event of the select.
   */
  public pickPhase(event: Event): void {
    this.phase.set((event.target as HTMLSelectElement).value);
  }
}
