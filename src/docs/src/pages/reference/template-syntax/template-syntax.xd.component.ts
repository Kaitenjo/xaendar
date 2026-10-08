import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Template syntax cheat sheet" page, in English.
 */
@WebComponent({
  selector: 'page-reference-template-syntax-en',
  templateUrl: './template-syntax.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceTemplateSyntaxPageEn extends CustomElement {}

/**
 * The "Template syntax cheat sheet" page, in Italian.
 */
@WebComponent({
  selector: 'page-reference-template-syntax-it',
  templateUrl: './template-syntax.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceTemplateSyntaxPageIt extends CustomElement {}
