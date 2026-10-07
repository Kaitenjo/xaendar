import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Signal options" page, in English.
 */
@WebComponent({
  selector: 'page-signals-options-en',
  templateUrl: './options.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsOptionsPageEn extends CustomElement {}

/**
 * The "Signal options" page, in Italian.
 */
@WebComponent({
  selector: 'page-signals-options-it',
  templateUrl: './options.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsOptionsPageIt extends CustomElement {}
