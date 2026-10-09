import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Event listeners" page.
 */
@WebComponent({
  selector: 'page-templates-events',
  templateUrl: './events.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesEventsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
