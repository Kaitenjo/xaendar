import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Build and Vite plugin" page.
 */
@WebComponent({
  selector: 'page-tools-build',
  styleUrl: '../../page.css',
  templateUrl: './build.xd.component.html'
})
export class ToolsBuildPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly translations = translations;
}
