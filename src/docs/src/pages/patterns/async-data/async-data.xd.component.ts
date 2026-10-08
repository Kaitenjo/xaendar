import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Async data" page, in English.
 */
@WebComponent({
  selector: 'page-patterns-async-data-en',
  templateUrl: './async-data.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsAsyncDataPageEn extends CustomElement {}

/**
 * The "Async data" page, in Italian.
 */
@WebComponent({
  selector: 'page-patterns-async-data-it',
  templateUrl: './async-data.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsAsyncDataPageIt extends CustomElement {}
