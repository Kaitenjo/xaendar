import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Inputs with @Property" page.
 */
@WebComponent({
  selector: 'page-components-inputs',
  templateUrl: './inputs.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsInputsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
