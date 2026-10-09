import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../core/i18n/i18n';

/**
 * The "What is Xaendar?" page.
 */
@WebComponent({
  selector: 'page-overview',
  templateUrl: './overview.xd.component.html',
  styleUrl: '../page.css'
})
export class OverviewPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
