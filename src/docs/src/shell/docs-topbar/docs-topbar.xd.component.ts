import type { Output } from '@xaendar/core';
import { CustomElement, Event, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { Lang } from '../../core/router/route-hash.utils';
import { LANGS } from '../../core/router/route-hash.utils';
import { href, lang, switchLang } from '../../core/router/router';

/**
 * The top bar: logo, search, language and theme switches, the link to the GitHub repository, and the menu
 * button on narrow screens.
 */
@WebComponent({
  selector: 'docs-topbar',
  styleUrl: './docs-topbar.xd.component.css',
  templateUrl: './docs-topbar.xd.component.html'
})
export class DocsTopbarComponent extends CustomElement {
  /**
   * Emitted when the menu button is pressed.
   */
  @Event()
  public accessor menuToggle!: Output;
  /**
   * The languages the reader can switch to.
   */
  public readonly langs = LANGS.map(lang => {
    const retVal: { label: string, value: Lang } = {
      label: lang,
      value: lang
    }
    return retVal
  });
  /**
   * The link to the home page.
   */
  public readonly home = computed(() => this._computeHome());

  /**
   * Asks the application to open or close the navigation.
   */
  public toggleMenu(): void {
    this.menuToggle.emit();
  }

  /**
   * Displays the current page in another language.
   *
   * @param target - The language to switch to.
   */
  public switchTo(target: CustomEvent<typeof this.langs[number]>): void {
    switchLang(target.detail.value);
  }

  /**
   * Computes the value of `home`.
   *
   * @returns The link to the home page.
   */
  private _computeHome(): string {
    return href('', lang());
  }
}
