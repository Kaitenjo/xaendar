import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Lists with @for" page, in English.
 */
@WebComponent({
  selector: 'page-templates-for-en',
  templateUrl: './for.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesForPageEn extends CustomElement {}

/**
 * The "Lists with @for" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-for-it',
  templateUrl: './for.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesForPageIt extends CustomElement {}
