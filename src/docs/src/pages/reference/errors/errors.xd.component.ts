import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Error encyclopedia" page, in English.
 */
@WebComponent({
  selector: 'page-reference-errors-en',
  templateUrl: './errors.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceErrorsPageEn extends CustomElement {}

/**
 * The "Error encyclopedia" page, in Italian.
 */
@WebComponent({
  selector: 'page-reference-errors-it',
  templateUrl: './errors.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceErrorsPageIt extends CustomElement {}
