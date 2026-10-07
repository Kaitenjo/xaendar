import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The page shown for unknown paths, in English.
 */
@WebComponent({
  selector: 'page-not-found-en',
  templateUrl: './not-found.en.xd.component.html',
  styleUrl: '../page.css'
})
export class NotFoundPageEn extends CustomElement {}

/**
 * The page shown for unknown paths, in Italian.
 */
@WebComponent({
  selector: 'page-not-found-it',
  templateUrl: './not-found.it.xd.component.html',
  styleUrl: '../page.css'
})
export class NotFoundPageIt extends CustomElement {}
