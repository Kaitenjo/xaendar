import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Expression syntax" page, in English.
 */
@WebComponent({
  selector: 'page-templates-expressions-en',
  templateUrl: './expressions.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesExpressionsPageEn extends CustomElement {}

/**
 * The "Expression syntax" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-expressions-it',
  templateUrl: './expressions.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesExpressionsPageIt extends CustomElement {}
