import { CustomElement, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import { translations } from '../../core/i18n/i18n';
import { lang, path } from '../../core/router/router';
import { findNeighbours, pageTitle } from '../../core/routes/routes';
import type { DocsPage } from '../../core/routes/routes';

/**
 * Links to the previous and the next page, in reading order.
 */
@WebComponent({
  selector: 'docs-pager',
  templateUrl: './docs-pager.xd.component.html',
  styleUrl: './docs-pager.xd.component.css'
})
export class DocsPagerComponent extends CustomElement {
  /**
   * The texts of the user interface.
   */
  public readonly translations = translations;
  /**
   * The current language.
   */
  public readonly currentLang = lang;
  /**
   * The page before the one being read.
   */
  public readonly previous = computed(() => this._computePrevious());
  /**
   * The page after the one being read.
   */
  public readonly next = computed(() => this._computeNext());

  /**
   * Reads the title of a page, in the current language.
   *
   * @param page - The page, if any.
   * @returns The title of the page, empty without a page.
   */
  public titleOf(page: DocsPage | undefined): string {
    return page ? pageTitle(page, this.translations()) : '';
  }

  /**
   * Computes the value of `previous`.
   *
   * @returns The page before the one being read.
   */
  private _computePrevious(): DocsPage | undefined {
    return findNeighbours(path()).previous;
  }

  /**
   * Computes the value of `next`.
   *
   * @returns The page after the one being read.
   */
  private _computeNext(): DocsPage | undefined {
    return findNeighbours(path()).next;
  }
}
