import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Lifecycle" page.
 */
@WebComponent({
  selector: 'page-components-lifecycle',
  templateUrl: './lifecycle.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsLifecyclePage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
