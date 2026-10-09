import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Attribute and property binding" page.
 */
@WebComponent({
  selector: 'page-templates-binding',
  templateUrl: './binding.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesBindingPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
