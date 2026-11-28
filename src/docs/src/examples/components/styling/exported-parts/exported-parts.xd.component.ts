import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Styles the tabs and the field from outside: the selected tab through the part it gains, the label of the button inside
 * the field through the part the field forwards.
 */
@WebComponent({
  selector: 'ex-exported-parts',
  styleUrl: './exported-parts.css',
  templateUrl: './exported-parts.xd.component.html'
})
export class ExportedPartsComponent extends CustomElement { }
