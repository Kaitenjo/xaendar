import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Custom directives" page, in English.
 */
@WebComponent({
  selector: 'page-directives-custom-en',
  templateUrl: './custom.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesCustomPageEn extends CustomElement {}

/**
 * The "Custom directives" page, in Italian.
 */
@WebComponent({
  selector: 'page-directives-custom-it',
  templateUrl: './custom.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesCustomPageIt extends CustomElement {}
