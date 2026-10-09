import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Signals overview" page.
 */
@WebComponent({
  selector: 'page-signals-overview',
  templateUrl: './overview.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsOverviewPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
