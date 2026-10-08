import { CustomElement, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { Computed } from '@xaendar/core/signals';
import { t } from '../../core/i18n/i18n';
import type { Messages } from '../../core/i18n/messages';
import type { Lang } from '../../core/router/route-hash.utils';
import { lang, path } from '../../core/router/router';
import { findNeighbours } from '../../core/routes/routes';

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
  public readonly t: Computed<Messages> = t;

  /**
   * The current language.
   */
  public readonly currentLang: Computed<Lang> = lang;

  /**
   * The page before the one being read.
   */
  public readonly previous = computed(() => findNeighbours(path()).previous);

  /**
   * The page after the one being read.
   */
  public readonly next = computed(() => findNeighbours(path()).next);
}
