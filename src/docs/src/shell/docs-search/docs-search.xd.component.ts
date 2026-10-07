import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { Computed, QuerySignal } from '@xaendar/core/signals';
import { t } from '../../core/i18n/i18n';
import type { Messages } from '../../core/i18n/messages';
import type { Lang } from '../../core/router/route-hash.utils';
import { lang, navigate } from '../../core/router/router';
import { searchPages } from '../../core/routes/routes';

/**
 * Searches the pages of the documentation by title and keywords. Pressing `/` anywhere focuses it.
 */
@WebComponent({
  selector: 'docs-search',
  templateUrl: './docs-search.xd.component.html',
  styleUrl: './docs-search.xd.component.css'
})
export class DocsSearchComponent extends CustomElement {
  /**
   * The search field.
   */
  @Query<HTMLInputElement>('input')
  public accessor input!: QuerySignal<HTMLInputElement | null>;

  /**
   * The texts of the user interface.
   */
  public readonly t: Computed<Messages> = t;

  /**
   * The current language.
   */
  public readonly lang: Computed<Lang> = lang;

  /**
   * The text typed by the reader.
   */
  public readonly query = signal('');

  /**
   * Whether the results are shown.
   */
  public readonly expanded = signal(false);

  /**
   * The index of the highlighted result.
   */
  public readonly active = signal(0);

  /**
   * The pages matching the query.
   */
  public readonly results = computed(() => searchPages(this.query(), this.lang()));

  /**
   * Focuses the search field when `/` is pressed outside of a text field.
   */
  private readonly onShortcut = (event: KeyboardEvent): void => {
    const target = event.composedPath()[0];
    const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (event.key === '/' && !typing) {
      event.preventDefault();
      this.input()?.focus();
    }
  };

  /**
   * Starts listening to the keyboard shortcut.
   */
  public onInit(): void {
    document.addEventListener('keydown', this.onShortcut);
  }

  /**
   * Stops listening to the keyboard shortcut.
   */
  public onDestroy(): void {
    document.removeEventListener('keydown', this.onShortcut);
  }

  /**
   * Updates the query as the reader types.
   *
   * @param event - The `input` event of the search field.
   */
  public onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
    this.active.set(0);
    this.expanded.set(true);
  }

  /**
   * Moves through the results with the arrow keys, opens one with Enter, closes them with Escape.
   *
   * @param event - The `keydown` event of the search field.
   */
  public onKeydown(event: KeyboardEvent): void {
    const count = this.results().length;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.active.set(count ? (this.active() + 1) % count : 0);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.active.set(count ? (this.active() - 1 + count) % count : 0);
        break;
      case 'Enter': {
        const page = this.results()[this.active()];
        if (page) {
          this.go(page.path);
        }
        break;
      }
      case 'Escape':
        this.reset();
        break;
    }
  }

  /**
   * Shows the results again when the field is focused.
   */
  public open(): void {
    this.expanded.set(true);
  }

  /**
   * Hides the results when the field loses the focus.
   */
  public close(): void {
    this.expanded.set(false);
  }

  /**
   * Displays a page and clears the search.
   *
   * @param target - The path of the page.
   */
  public go(target: string): void {
    navigate(target);
    this.reset();
  }

  /**
   * Builds the link to a page.
   *
   * @param target - The path of the page.
   * @returns The `href` of the page.
   */
  public linkTo(target: string): string {
    return `#/${this.lang()}/${target}`;
  }

  /**
   * Clears the search and leaves the field.
   */
  private reset(): void {
    const input = this.input();
    if (input) {
      // The value is a property of the field: binding the "value" attribute would not clear what was typed
      input.value = '';
      input.blur();
    }
    this.query.set('');
    this.expanded.set(false);
  }
}
