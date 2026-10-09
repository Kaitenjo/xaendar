import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Error encyclopedia" page.
 */
@WebComponent({
  selector: 'page-reference-errors',
  templateUrl: './errors.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceErrorsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
