import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Styling" page.
 */
@WebComponent({
  selector: 'page-components-styling',
  styleUrl: '../../page.css',
  templateUrl: './styling.xd.component.html'
})
export class ComponentsStylingPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
