import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Lists with @for" page.
 */
@WebComponent({
  selector: 'page-templates-for',
  templateUrl: './for.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesForPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
