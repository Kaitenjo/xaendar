import { CustomElement, WebComponent } from '@xaendar/core';
import { signal, untracked } from '@xaendar/core/signals';
import { lang, path } from '../../core/router/router';
import { NAV } from '../../core/routes/routes';
import type { NavItem } from '../../core/routes/routes';

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
   * The current language.
   */
  public readonly currentLang = lang;
  /**
   * The path of the page being read.
   */
  public readonly path = path;
  /**
   * The groups currently expanded, by English title.
   */
  public readonly expanded = signal<ReadonlySet<string>>(new Set());

  /**
   * Expands the group of the page being read, whenever another page is displayed.
   */
  public onInit(): void {
    this.effect(() => {
      const current = this.path();
      const group = NAV.flatMap(section => section.items).find(item => item.pages?.some(page => page.path === current));
      if (group) {
        untracked(() => this.expanded.update(expanded => new Set(expanded).add(group.title.en)));
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
    return this.expanded().has(item.title.en);
  }

  /**
   * Expands or collapses a group.
   *
   * @param item - The group.
   */
  public toggle(item: NavItem): void {
    this.expanded.update(expanded => {
      const next = new Set(expanded);
      if (!next.delete(item.title.en)) {
        next.add(item.title.en);
      }
      return next;
    });
  }
}
