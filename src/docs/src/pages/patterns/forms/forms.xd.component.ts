import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Forms" page.
 */
@WebComponent({
  selector: 'page-patterns-forms',
  templateUrl: './forms.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsFormsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
