import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Forms" page.
 */
@WebComponent({
  selector: 'page-patterns-forms',
  styleUrl: '../../page.css',
  templateUrl: './forms.xd.component.html'
})
export class PatternsFormsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
