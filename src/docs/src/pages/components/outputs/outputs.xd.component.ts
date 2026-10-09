import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Outputs with @Event" page.
 */
@WebComponent({
  selector: 'page-components-outputs',
  templateUrl: './outputs.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsOutputsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
