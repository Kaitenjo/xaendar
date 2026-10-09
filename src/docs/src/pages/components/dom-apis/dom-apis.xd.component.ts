import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Using DOM APIs" page.
 */
@WebComponent({
  selector: 'page-components-dom-apis',
  templateUrl: './dom-apis.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsDomApisPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
