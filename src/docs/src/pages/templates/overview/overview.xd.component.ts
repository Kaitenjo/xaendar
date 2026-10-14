import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Template syntax" page.
 */
@WebComponent({
  selector: 'page-templates-overview',
  styleUrl: '../../page.css',
  templateUrl: './overview.xd.component.html'
})
export class TemplatesOverviewPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
