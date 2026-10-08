import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Rendering HTML" page, in English.
 */
@WebComponent({
  selector: 'page-patterns-html-rendering-en',
  templateUrl: './html-rendering.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsHtmlRenderingPageEn extends CustomElement {}

/**
 * The "Rendering HTML" page, in Italian.
 */
@WebComponent({
  selector: 'page-patterns-html-rendering-it',
  templateUrl: './html-rendering.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsHtmlRenderingPageIt extends CustomElement {}
