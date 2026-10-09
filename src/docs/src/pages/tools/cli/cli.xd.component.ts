import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "CLI" page.
 */
@WebComponent({
  selector: 'page-tools-cli',
  templateUrl: './cli.xd.component.html',
  styleUrl: '../../page.css'
})
export class ToolsCliPage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
