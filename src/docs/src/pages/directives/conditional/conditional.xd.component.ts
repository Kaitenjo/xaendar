import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Conditional directives" page, in English.
 */
@WebComponent({
  selector: 'page-directives-conditional-en',
  templateUrl: './conditional.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesConditionalPageEn extends CustomElement {}

/**
 * The "Conditional directives" page, in Italian.
 */
@WebComponent({
  selector: 'page-directives-conditional-it',
  templateUrl: './conditional.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesConditionalPageIt extends CustomElement {}
