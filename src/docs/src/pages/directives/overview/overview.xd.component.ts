import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Directives overview" page.
 */
@WebComponent({
  selector: 'page-directives-overview',
  templateUrl: './overview.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesOverviewPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
