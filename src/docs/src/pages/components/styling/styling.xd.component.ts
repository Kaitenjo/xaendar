import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Styling" page.
 */
@WebComponent({
  selector: 'page-components-styling',
  templateUrl: './styling.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsStylingPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
