import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Projects the same elements into an inspector running several content queries on them.
 */
@WebComponent({
  selector: 'ex-content-inspector',
  styleUrl: './content-inspector.css',
  templateUrl: './content-inspector.xd.component.html'
})
export class ContentInspectorComponent extends CustomElement {}
