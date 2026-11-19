import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Content projection with slots" page.
 */
@WebComponent({
  selector: 'page-components-content-projection',
  styleUrl: '../../page.css',
  templateUrl: './content-projection.xd.component.html'
})
export class ComponentsContentProjectionPage extends CustomElement {}
