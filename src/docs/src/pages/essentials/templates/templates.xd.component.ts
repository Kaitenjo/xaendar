import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Dynamic templates" page.
 */
@WebComponent({
  selector: 'page-essentials-templates',
  styleUrl: '../../page.css',
  templateUrl: './templates.xd.component.html'
})
export class EssentialsTemplatesPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
