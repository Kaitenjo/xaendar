import { CustomElement, WebComponent } from '@xaendar/core';
import { translations } from '../../../core/i18n/i18n';

/**
 * The "Language service and VS Code" page.
 */
@WebComponent({
  selector: 'page-tools-language-service',
  templateUrl: './language-service.xd.component.html',
  styleUrl: '../../page.css'
})
export class ToolsLanguageServicePage extends CustomElement {
  /**
   * The texts of the documentation, in the current language.
   */
  public readonly t = translations;
}
