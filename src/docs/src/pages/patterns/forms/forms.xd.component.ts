import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Forms" page, in English.
 */
@WebComponent({
  selector: 'page-patterns-forms-en',
  templateUrl: './forms.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsFormsPageEn extends CustomElement {}

/**
 * The "Forms" page, in Italian.
 */
@WebComponent({
  selector: 'page-patterns-forms-it',
  templateUrl: './forms.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class PatternsFormsPageIt extends CustomElement {}
