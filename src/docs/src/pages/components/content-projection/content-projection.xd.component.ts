import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Content projection with slots" page.
 */
@WebComponent({
  selector: 'page-components-content-projection',
  styleUrl: '../../page.css',
  templateUrl: './content-projection.xd.component.html'
})
export class ComponentsContentProjectionPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
