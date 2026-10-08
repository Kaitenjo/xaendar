import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Theming" page, in English.
 */
@WebComponent({
  selector: 'page-patterns-theming-en',
  templateUrl: './theming.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsThemingPageEn extends CustomElement {}

/**
 * The "Theming" page, in Italian.
 */
@WebComponent({
  selector: 'page-patterns-theming-it',
  templateUrl: './theming.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsThemingPageIt extends CustomElement {}
