import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Content chosen by media queries.
 */
@WebComponent({
  selector: 'ex-media-layout',
  styleUrl: './media-layout.css',
  templateUrl: './media-layout.xd.component.html'
})
export class MediaLayoutComponent extends CustomElement {}
