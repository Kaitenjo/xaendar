import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Custom directives" page.
 */
@WebComponent({
  selector: 'page-directives-custom',
  templateUrl: './custom.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesCustomPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
