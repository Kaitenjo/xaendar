import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "CLI" page, in English.
 */
@WebComponent({
  selector: 'page-tools-cli-en',
  templateUrl: './cli.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ToolsCliPageEn extends CustomElement {}

/**
 * The "CLI" page, in Italian.
 */
@WebComponent({
  selector: 'page-tools-cli-it',
  templateUrl: './cli.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ToolsCliPageIt extends CustomElement {}
