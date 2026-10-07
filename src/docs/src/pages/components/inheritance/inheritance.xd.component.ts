import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Inheritance" page, in English.
 */
@WebComponent({
  selector: 'page-components-inheritance-en',
  templateUrl: './inheritance.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsInheritancePageEn extends CustomElement {}

/**
 * The "Inheritance" page, in Italian.
 */
@WebComponent({
  selector: 'page-components-inheritance-it',
  templateUrl: './inheritance.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ComponentsInheritancePageIt extends CustomElement {}
