import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Effects" page.
 */
@WebComponent({
  selector: 'page-signals-effects',
  templateUrl: './effects.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsEffectsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
