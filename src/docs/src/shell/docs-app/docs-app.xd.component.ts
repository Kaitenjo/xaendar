import { CustomElement, WebComponent } from '@xaendar/core';
import { signal, untracked } from '@xaendar/core/signals';
import { path } from '../../core/router/router';

/**
 * The root of the documentation: top bar, navigation and the page being read.
 */
@WebComponent({
  selector: 'docs-app',
  templateUrl: './docs-app.xd.component.html',
  styleUrl: './docs-app.xd.component.css'
})
export class DocsAppComponent extends CustomElement {
  /**
   * Whether the navigation drawer is open, on narrow screens.
   */
  public readonly navOpen = signal(false);

  /**
   * Closes the navigation drawer whenever another page is displayed.
   */
  public onInit(): void {
    this.effect(() => {
      path();
      untracked(() => this.navOpen.set(false));
    });
  }

  /**
   * Opens or closes the navigation drawer.
   */
  public toggleNav(): void {
    this.navOpen.update(open => !open);
  }

  /**
   * Closes the navigation drawer.
   */
  public closeNav(): void {
    this.navOpen.set(false);
  }
}
