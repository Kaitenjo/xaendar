import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Advanced: Signal.subtle" page.
 */
@WebComponent({
  selector: 'page-signals-advanced',
  templateUrl: './advanced.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsAdvancedPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
