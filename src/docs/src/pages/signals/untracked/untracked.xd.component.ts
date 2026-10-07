import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Reading without tracking" page, in English.
 */
@WebComponent({
  selector: 'page-signals-untracked-en',
  templateUrl: './untracked.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsUntrackedPageEn extends CustomElement {}

/**
 * The "Reading without tracking" page, in Italian.
 */
@WebComponent({
  selector: 'page-signals-untracked-it',
  templateUrl: './untracked.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class SignalsUntrackedPageIt extends CustomElement {}
