import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Projects the same elements into an inspector running several content queries on them.
 */
@WebComponent({
  selector: 'ex-content-inspector',
  templateUrl: './content-inspector.xd.component.html',
  styleUrl: './content-inspector.css'
})
export class ContentInspectorComponent extends CustomElement {}
