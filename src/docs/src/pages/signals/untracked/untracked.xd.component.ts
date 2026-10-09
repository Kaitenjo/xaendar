import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Reading without tracking" page.
 */
@WebComponent({
  selector: 'page-signals-untracked',
  templateUrl: './untracked.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsUntrackedPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
