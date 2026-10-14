import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Directives overview" page.
 */
@WebComponent({
  selector: 'page-directives-overview',
  styleUrl: '../../page.css',
  templateUrl: './overview.xd.component.html'
})
export class DirectivesOverviewPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
