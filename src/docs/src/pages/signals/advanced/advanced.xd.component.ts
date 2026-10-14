import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Advanced: Signal.subtle" page.
 */
@WebComponent({
  selector: 'page-signals-advanced',
  styleUrl: '../../page.css',
  templateUrl: './advanced.xd.component.html'
})
export class SignalsAdvancedPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
