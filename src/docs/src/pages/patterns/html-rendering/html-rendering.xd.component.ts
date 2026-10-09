import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Rendering HTML" page.
 */
@WebComponent({
  selector: 'page-patterns-html-rendering',
  templateUrl: './html-rendering.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsHtmlRenderingPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
