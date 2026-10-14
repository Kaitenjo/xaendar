import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../core/i18n/i18n';

/**
 * The "What is Xaendar?" page.
 */
@WebComponent({
  selector: 'page-overview',
  styleUrl: '../page.css',
  templateUrl: './overview.xd.component.html'
})
export class OverviewPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
