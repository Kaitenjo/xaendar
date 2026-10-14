import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Conditional directives" page.
 */
@WebComponent({
  selector: 'page-directives-conditional',
  styleUrl: '../../page.css',
  templateUrl: './conditional.xd.component.html'
})
export class DirectivesConditionalPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
