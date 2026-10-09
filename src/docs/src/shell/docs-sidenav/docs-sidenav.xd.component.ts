import { CustomElement, WebComponent } from '@xaendar/core';
import { signal, untracked } from '@xaendar/core/signals';
import { translations } from '../../core/i18n/i18n';
import { lang, path } from '../../core/router/router';
import { itemTitle, NAV, pageTitle } from '../../core/routes/routes';
import type { DocsPage, NavItem } from '../../core/routes/routes';

/**
 * The navigation of the documentation: titled sections of links and collapsible groups.
 * The group of the page being read is expanded automatically.
 */
@WebComponent({
  selector: 'docs-sidenav',
  templateUrl: './docs-sidenav.xd.component.html',
  styleUrl: './docs-sidenav.xd.component.css'
})
export class DocsSidenavComponent extends CustomElement {
  /**
   * The sections of the navigation.
   */
  public readonly sections = NAV;
  /**
   * The texts of the user interface.
   */
  public readonly translations = translations;
  /**
   * The current language.
   */
  public readonly currentLang = lang;
  /**
   * The path of the page being read.
   */
  public readonly path = path;
  /**
   * The groups currently expanded, by key.
   */
  public readonly expanded = signal<ReadonlySet<string>>(new Set());

  /**
   * Expands the group of the page being read, whenever another page is displayed.
   */
  public onInit(): void {
    this.effect(() => {
      const current = this.path();
      const group = NAV.flatMap(section => section.items).find(item => item.pages?.some(page => page.path === current))?.group;
      if (group) {
        untracked(() => this.expanded.update(expanded => new Set(expanded).add(group)));
      }
    });
  }

  /**
   * Tells whether a group is expanded.
   *
   * @param item - The group.
   * @returns `true` if the pages of the group are shown.
   */
  public isExpanded(item: NavItem): boolean {
    return !!item.group && this.expanded().has(item.group);
  }

  /**
   * Reads the label of an entry, in the current language.
   *
   * @param item - The entry.
   * @returns The title of the page of a link, or the label of a group.
   */
  public titleOf(item: NavItem): string {
    return itemTitle(item, this.translations());
  }

  /**
   * Reads the title of a page of a group, in the current language.
   *
   * @param page - The page.
   * @returns The title of the page.
   */
  public pageTitleOf(page: DocsPage): string {
    return pageTitle(page, this.translations());
  }

  /**
   * Expands or collapses a group.
   *
   * @param item - The group.
   */
  public toggle(item: NavItem): void {
    const key = item.group;
    if (!key) {
      return;
    }
    this.expanded.update(expanded => {
      const next = new Set(expanded);
      if (!next.delete(key)) {
        next.add(key);
      }
      return next;
    });
  }
}
