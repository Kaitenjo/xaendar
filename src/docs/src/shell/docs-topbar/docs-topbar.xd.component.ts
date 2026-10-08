import { CustomElement, Event, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { Computed, Signal } from '@xaendar/core/signals';
import { t } from '../../core/i18n/i18n';
import type { Messages } from '../../core/i18n/messages';
import { LANGS } from '../../core/router/route-hash.utils';
import type { Lang } from '../../core/router/route-hash.utils';
import { href, lang, switchLang } from '../../core/router/router';
import { theme, toggleTheme } from '../../core/theme/theme';
import type { Theme } from '../../core/theme/theme';

/**
 * The top bar: logo, search, language and theme switches, and the menu button on narrow screens.
 */
@WebComponent({
  selector: 'docs-topbar',
  templateUrl: './docs-topbar.xd.component.html',
  styleUrl: './docs-topbar.xd.component.css'
})
export class DocsTopbarComponent extends CustomElement {
  /**
   * Emitted when the menu button is pressed.
   */
  @Event()
  public accessor menuToggle!: Output;

  /**
   * The texts of the user interface.
   */
  public readonly t: Computed<Messages> = t;

  /**
   * The current language.
   */
  public readonly currentLang: Computed<Lang> = lang;

  /**
   * The current theme.
   */
  public readonly theme: Signal<Theme> = theme;

  /**
   * The languages the reader can switch to.
   */
  public readonly langs = LANGS;

  /**
   * The link to the home page.
   */
  public readonly home = computed(() => href('', this.currentLang()));

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
  public switchTo(target: Lang): void {
    switchLang(target);
  }

  /**
   * Switches between the light and the dark theme.
   */
  public toggleTheme(): void {
    toggleTheme();
  }
}
