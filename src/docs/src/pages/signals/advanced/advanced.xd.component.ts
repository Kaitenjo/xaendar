import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Advanced: Signal.subtle" page, in English.
 */
@WebComponent({
  selector: 'page-signals-advanced-en',
  templateUrl: './advanced.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsAdvancedPageEn extends CustomElement {}

/**
 * The "Advanced: Signal.subtle" page, in Italian.
 */
@WebComponent({
  selector: 'page-signals-advanced-it',
  templateUrl: './advanced.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsAdvancedPageIt extends CustomElement {}
