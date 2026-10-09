import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Sharing state" page.
 */
@WebComponent({
  selector: 'page-signals-shared-state',
  templateUrl: './shared-state.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsSharedStatePage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
