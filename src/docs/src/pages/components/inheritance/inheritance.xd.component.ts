import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Inheritance" page.
 */
@WebComponent({
  selector: 'page-components-inheritance',
  templateUrl: './inheritance.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsInheritancePage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
