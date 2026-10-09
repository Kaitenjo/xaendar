import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Expression syntax" page.
 */
@WebComponent({
  selector: 'page-templates-expressions',
  templateUrl: './expressions.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesExpressionsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
