import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Routing" page.
 */
@WebComponent({
  selector: 'page-patterns-routing',
  styleUrl: '../../page.css',
  templateUrl: './routing.xd.component.html'
})
export class PatternsRoutingPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
