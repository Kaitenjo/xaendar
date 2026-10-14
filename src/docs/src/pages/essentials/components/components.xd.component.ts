import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Components" page.
 */
@WebComponent({
  selector: 'page-essentials-components',
  styleUrl: '../../page.css',
  templateUrl: './components.xd.component.html'
})
export class EssentialsComponentsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
