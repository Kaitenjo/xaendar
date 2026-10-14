import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Structural directives" page.
 */
@WebComponent({
  selector: 'page-directives-structural',
  styleUrl: '../../page.css',
  templateUrl: './structural.xd.component.html'
})
export class DirectivesStructuralPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
