import { CustomElement, WebComponent } from '@xaendar/core';
import { back, canGoBack, navigate, path, route } from './router';
import { USERS } from './users';

/**
 * The shell of a small application: links, a back button, and the page of the current route.
 */
@WebComponent({
  selector: 'ex-mini-router',
  templateUrl: './mini-router.xd.component.html',
  styleUrl: './mini-router.css'
})
export class MiniRouterComponent extends CustomElement {
  /**
   * The current path.
   */
  public readonly path = path;
  /**
   * The current route.
   */
  public readonly route = route;
  /**
   * Whether there is a page to go back to.
   */
  public readonly canGoBack = canGoBack;
  /**
   * The users listed by the users page.
   */
  public readonly users = USERS;

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

  /**
   * Goes back to the previous page.
   */
  public goBack(): void {
    back();
  }
}
