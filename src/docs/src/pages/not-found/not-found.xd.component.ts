import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The page shown for unknown paths.
 */
@WebComponent({
  selector: 'page-not-found',
  styleUrl: '../page.css',
  templateUrl: './not-found.xd.component.html'
})
export class NotFoundPage extends CustomElement {}
