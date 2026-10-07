import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Effects" page, in English.
 */
@WebComponent({
  selector: 'page-signals-effects-en',
  templateUrl: './effects.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsEffectsPageEn extends CustomElement {}

/**
 * The "Effects" page, in Italian.
 */
@WebComponent({
  selector: 'page-signals-effects-it',
  templateUrl: './effects.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsEffectsPageIt extends CustomElement {}
