import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Two components with different templates and the same logic, inherited from a base class.
 */
@WebComponent({
  selector: 'ex-shared-base',
  styleUrl: './shared-base.css',
  templateUrl: './shared-base.xd.component.html'
})
export class SharedBaseComponent extends CustomElement {}
