import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Event listeners" page.
 */
@WebComponent({
  selector: 'page-templates-events',
  styleUrl: '../../page.css',
  templateUrl: './events.xd.component.html'
})
export class TemplatesEventsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
