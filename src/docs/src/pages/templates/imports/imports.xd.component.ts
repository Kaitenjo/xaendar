import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Importing components" page, in English.
 */
@WebComponent({
  selector: 'page-templates-imports-en',
  templateUrl: './imports.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesImportsPageEn extends CustomElement {}

/**
 * The "Importing components" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-imports-it',
  templateUrl: './imports.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesImportsPageIt extends CustomElement {}
