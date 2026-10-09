import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Text interpolation" page.
 */
@WebComponent({
  selector: 'page-templates-text-interpolation',
  templateUrl: './text-interpolation.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesTextInterpolationPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
