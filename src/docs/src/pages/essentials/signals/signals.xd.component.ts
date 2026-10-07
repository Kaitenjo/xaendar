import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Reactivity with signals" page, in English.
 */
@WebComponent({
  selector: 'page-essentials-signals-en',
  templateUrl: './signals.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsSignalsPageEn extends CustomElement {}

/**
 * The "Reactivity with signals" page, in Italian.
 */
@WebComponent({
  selector: 'page-essentials-signals-it',
  templateUrl: './signals.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsSignalsPageIt extends CustomElement {}
