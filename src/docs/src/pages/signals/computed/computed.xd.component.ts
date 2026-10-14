import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Computed signals" page.
 */
@WebComponent({
  selector: 'page-signals-computed',
  styleUrl: '../../page.css',
  templateUrl: './computed.xd.component.html'
})
export class SignalsComputedPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
