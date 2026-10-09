import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The page shown for unknown paths.
 */
@WebComponent({
  selector: 'page-not-found',
  templateUrl: './not-found.xd.component.html',
  styleUrl: '../page.css'
})
export class NotFoundPage extends CustomElement {}
