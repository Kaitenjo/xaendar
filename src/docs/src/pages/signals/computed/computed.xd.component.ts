import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Computed signals" page, in English.
 */
@WebComponent({
  selector: 'page-signals-computed-en',
  templateUrl: './computed.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsComputedPageEn extends CustomElement {}

/**
 * The "Computed signals" page, in Italian.
 */
@WebComponent({
  selector: 'page-signals-computed-it',
  templateUrl: './computed.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsComputedPageIt extends CustomElement {}
