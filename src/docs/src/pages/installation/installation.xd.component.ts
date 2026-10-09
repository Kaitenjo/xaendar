import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../core/i18n/i18n';

/**
 * The "Installation" page.
 */
@WebComponent({
  selector: 'page-installation',
  templateUrl: './installation.xd.component.html',
  styleUrl: '../page.css'
})
export class InstallationPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
