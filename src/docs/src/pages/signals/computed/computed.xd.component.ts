import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Computed signals" page.
 */
@WebComponent({
  selector: 'page-signals-computed',
  templateUrl: './computed.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsComputedPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
