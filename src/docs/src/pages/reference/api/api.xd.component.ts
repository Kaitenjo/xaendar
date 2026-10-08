import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "API reference" page, in English.
 */
@WebComponent({
  selector: 'page-reference-api-en',
  templateUrl: './api.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceApiPageEn extends CustomElement {}

/**
 * The "API reference" page, in Italian.
 */
@WebComponent({
  selector: 'page-reference-api-it',
  templateUrl: './api.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceApiPageIt extends CustomElement {}
