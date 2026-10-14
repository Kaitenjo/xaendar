import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Conditional bindings" page.
 */
@WebComponent({
  selector: 'page-templates-conditional-bindings',
  styleUrl: '../../page.css',
  templateUrl: './conditional-bindings.xd.component.html'
})
export class TemplatesConditionalBindingsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
