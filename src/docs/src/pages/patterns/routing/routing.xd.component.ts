import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Routing" page.
 */
@WebComponent({
  selector: 'page-patterns-routing',
  templateUrl: './routing.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsRoutingPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
