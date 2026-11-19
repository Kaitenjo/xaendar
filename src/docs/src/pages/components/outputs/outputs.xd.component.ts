import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Outputs with @Event" page.
 */
@WebComponent({
  selector: 'page-components-outputs',
  styleUrl: '../../page.css',
  templateUrl: './outputs.xd.component.html'
})
export class ComponentsOutputsPage extends CustomElement {}
