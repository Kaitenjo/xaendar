import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Conditionals with @if" page, in English.
 */
@WebComponent({
  selector: 'page-templates-if-en',
  templateUrl: './if.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesIfPageEn extends CustomElement {}

/**
 * The "Conditionals with @if" page, in Italian.
 */
@WebComponent({
  selector: 'page-templates-if-it',
  templateUrl: './if.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class TemplatesIfPageIt extends CustomElement {}
