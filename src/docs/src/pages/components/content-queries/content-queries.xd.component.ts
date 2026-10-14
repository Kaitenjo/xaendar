import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Content queries" page.
 */
@WebComponent({
  selector: 'page-components-content-queries',
  styleUrl: '../../page.css',
  templateUrl: './content-queries.xd.component.html'
})
export class ComponentsContentQueriesPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
