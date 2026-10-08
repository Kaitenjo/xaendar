import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * Content chosen by media queries.
 */
@WebComponent({
  selector: 'ex-media-layout',
  templateUrl: './media-layout.xd.component.html',
  styleUrl: './media-layout.css'
})
export class MediaLayoutComponent extends CustomElement {}
