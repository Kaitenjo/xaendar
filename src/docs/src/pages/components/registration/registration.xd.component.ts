import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Selectors and registration" page.
 */
@WebComponent({
  selector: 'page-components-registration',
  styleUrl: '../../page.css',
  templateUrl: './registration.xd.component.html'
})
export class ComponentsRegistrationPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
