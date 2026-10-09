import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Conditionals with @if" page.
 */
@WebComponent({
  selector: 'page-templates-if',
  templateUrl: './if.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesIfPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
