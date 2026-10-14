import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../core/i18n/i18n';

/**
 * The "Tutorial: a todo app" page.
 */
@WebComponent({
  selector: 'page-tutorial',
  styleUrl: '../page.css',
  templateUrl: './tutorial.xd.component.html'
})
export class TutorialPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
