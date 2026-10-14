import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Signal options" page.
 */
@WebComponent({
  selector: 'page-signals-options',
  styleUrl: '../../page.css',
  templateUrl: './options.xd.component.html'
})
export class SignalsOptionsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
