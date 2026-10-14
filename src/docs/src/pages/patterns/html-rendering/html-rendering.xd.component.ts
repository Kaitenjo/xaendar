import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Rendering HTML" page.
 */
@WebComponent({
  selector: 'page-patterns-html-rendering',
  styleUrl: '../../page.css',
  templateUrl: './html-rendering.xd.component.html'
})
export class PatternsHtmlRenderingPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
