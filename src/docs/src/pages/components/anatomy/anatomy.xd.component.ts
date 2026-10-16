import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Anatomy of a component" page.
 */
@WebComponent({
  selector: 'page-components-anatomy',
  styleUrl: '../../page.css',
  templateUrl: './anatomy.xd.component.html'
})
export class ComponentsAnatomyPage extends CustomElement {}
