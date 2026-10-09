import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Coming from Angular" page.
 */
@WebComponent({
  selector: 'page-reference-coming-from-angular',
  templateUrl: './coming-from-angular.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceComingFromAngularPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
