import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Inheritance" page.
 */
@WebComponent({
  selector: 'page-components-inheritance',
  styleUrl: '../../page.css',
  templateUrl: './inheritance.xd.component.html'
})
export class ComponentsInheritancePage extends CustomElement {}
