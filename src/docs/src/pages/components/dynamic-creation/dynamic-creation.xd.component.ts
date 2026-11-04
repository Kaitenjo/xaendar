import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Creating components in code" page.
 */
@WebComponent({
  selector: 'page-components-dynamic-creation',
  styleUrl: '../../page.css',
  templateUrl: './dynamic-creation.xd.component.html'
})
export class ComponentsDynamicCreationPage extends CustomElement {}
