import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Anatomy of a component" page.
 */
@WebComponent({
  selector: 'page-components-anatomy',
  templateUrl: './anatomy.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsAnatomyPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
