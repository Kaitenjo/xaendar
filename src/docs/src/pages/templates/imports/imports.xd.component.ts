import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Importing components" page.
 */
@WebComponent({
  selector: 'page-templates-imports',
  templateUrl: './imports.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesImportsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
