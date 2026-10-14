import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Anatomy of a component" page.
 */
@WebComponent({
  selector: 'page-components-anatomy',
  styleUrl: '../../page.css',
  templateUrl: './anatomy.xd.component.html'
})
export class ComponentsAnatomyPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
