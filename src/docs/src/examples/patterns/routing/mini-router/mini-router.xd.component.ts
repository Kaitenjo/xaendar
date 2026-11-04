import { CustomElement, WebComponent } from '@xaendar/core';
import { navigate } from './router';

/**
 * The shell of a small application: links, a back button, and the page of the current route.
 */
@WebComponent({
  selector: 'ex-mini-router',
  styleUrl: './mini-router.css',
  templateUrl: './mini-router.xd.component.html'
})
export class MiniRouterComponent extends CustomElement {
  /**
   * Follows a link without leaving the page: the href is kept, so the link can still be copied or opened elsewhere.
   *
   * @param event - The click event of the link.
   */
  public follow(event: MouseEvent): void {
    event.preventDefault();
    const link = event.currentTarget as HTMLAnchorElement;
    navigate(link.getAttribute('href') ?? '/');
  }
}
