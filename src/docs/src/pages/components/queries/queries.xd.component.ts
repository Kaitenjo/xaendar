import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "View queries" page.
 */
@WebComponent({
  selector: 'page-components-queries',
  templateUrl: './queries.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsQueriesPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
