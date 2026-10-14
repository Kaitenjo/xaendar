import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Lists and CRUD" page.
 */
@WebComponent({
  selector: 'page-patterns-lists',
  styleUrl: '../../page.css',
  templateUrl: './lists.xd.component.html'
})
export class PatternsListsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
