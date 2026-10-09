import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Components" page.
 */
@WebComponent({
  selector: 'page-essentials-components',
  templateUrl: './components.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsComponentsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
