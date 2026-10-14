import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "SVG and MathML" page.
 */
@WebComponent({
  selector: 'page-templates-svg-mathml',
  styleUrl: '../../page.css',
  templateUrl: './svg-mathml.xd.component.html'
})
export class TemplatesSvgMathmlPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
