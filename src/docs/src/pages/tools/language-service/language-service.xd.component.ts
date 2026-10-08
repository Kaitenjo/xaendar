import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Language service and VS Code" page, in English.
 */
@WebComponent({
  selector: 'page-tools-language-service-en',
  templateUrl: './language-service.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ToolsLanguageServicePageEn extends CustomElement {}

/**
 * The "Language service and VS Code" page, in Italian.
 */
@WebComponent({
  selector: 'page-tools-language-service-it',
  templateUrl: './language-service.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ToolsLanguageServicePageIt extends CustomElement {}
