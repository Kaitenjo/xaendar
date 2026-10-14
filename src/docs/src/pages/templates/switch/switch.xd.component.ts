import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Branching with @switch" page.
 */
@WebComponent({
  selector: 'page-templates-switch',
  styleUrl: '../../page.css',
  templateUrl: './switch.xd.component.html'
})
export class TemplatesSwitchPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
