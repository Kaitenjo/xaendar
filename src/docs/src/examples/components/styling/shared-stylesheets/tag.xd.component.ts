import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A tag: the shared base stylesheet alone.
 */
@WebComponent({
  selector: 'ex-tag',
  styleUrl: ['./base.css'],
  templateUrl: './tag.xd.component.html'
})
export class TagComponent extends CustomElement { }
