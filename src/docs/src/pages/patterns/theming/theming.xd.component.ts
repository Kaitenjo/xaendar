import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Theming" page.
 */
@WebComponent({
  selector: 'page-patterns-theming',
  templateUrl: './theming.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsThemingPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
