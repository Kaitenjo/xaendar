import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Async data" page.
 */
@WebComponent({
  selector: 'page-patterns-async-data',
  styleUrl: '../../page.css',
  templateUrl: './async-data.xd.component.html'
})
export class PatternsAsyncDataPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
