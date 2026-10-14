import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Text interpolation" page.
 */
@WebComponent({
  selector: 'page-templates-text-interpolation',
  styleUrl: '../../page.css',
  templateUrl: './text-interpolation.xd.component.html'
})
export class TemplatesTextInterpolationPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
