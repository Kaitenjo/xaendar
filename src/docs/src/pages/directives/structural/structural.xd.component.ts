import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Structural directives" page, in English.
 */
@WebComponent({
  selector: 'page-directives-structural-en',
  templateUrl: './structural.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesStructuralPageEn extends CustomElement {}

/**
 * The "Structural directives" page, in Italian.
 */
@WebComponent({
  selector: 'page-directives-structural-it',
  templateUrl: './structural.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class DirectivesStructuralPageIt extends CustomElement {}
