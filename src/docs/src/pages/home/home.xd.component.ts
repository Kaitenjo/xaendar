import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../core/i18n/i18n';

/**
 * The home page.
 */
@WebComponent({
  selector: 'page-home',
  templateUrl: './home.xd.component.html',
  styleUrl: '../page.css'
})
export class HomePage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
