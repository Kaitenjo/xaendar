import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Error encyclopedia" page.
 */
@WebComponent({
  selector: 'page-reference-errors',
  styleUrl: '../../page.css',
  templateUrl: './errors.xd.component.html'
})
export class ReferenceErrorsPage extends CustomElement {}
