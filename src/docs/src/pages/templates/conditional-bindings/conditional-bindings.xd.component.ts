import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Conditional bindings" page.
 */
@WebComponent({
  selector: 'page-templates-conditional-bindings',
  templateUrl: './conditional-bindings.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesConditionalBindingsPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
