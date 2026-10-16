import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { InputSignal, signal, untracked } from '@xaendar/core/signals';
import { path } from '../../core/router/router';

/**
 * The root of the documentation: top bar, navigation and the page being read.
 */
@WebComponent({
  selector: 'docs-app',
  styleUrl: './docs-app.xd.component.css',
  templateUrl: './docs-app.xd.component.html'
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

/**
 * The root of the documentation: top bar, navigation and the page being read.
 */
@WebComponent({
  selector: 'test-test',
  templateUrl: './x.xd.html'
})
export class Test<T extends string | number, K = T extends string ? Array<string> : Array<number>> extends CustomElement {
  /**
   * Whether the navigation drawer is open, on narrow screens.
   */
  @Property.required()
  public accessor navOpen!: InputSignal<K>
}