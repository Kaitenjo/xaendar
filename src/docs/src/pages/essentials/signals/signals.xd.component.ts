import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Reactivity with signals" page.
 */
@WebComponent({
  selector: 'page-essentials-signals',
  templateUrl: './signals.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsSignalsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
