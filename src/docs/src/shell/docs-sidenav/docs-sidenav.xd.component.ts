import { CustomElement, WebComponent } from '@xaendar/core';
import { signal, untracked } from '@xaendar/core/signals';
import { path } from '../../core/router/router';
import { NAV } from '../../core/routes/routes';
import type { NavItem } from '../../core/routes/routes';

/**
 * The navigation of the documentation: titled sections of links and collapsible groups.
 * The group of the page being read is expanded automatically.
 */
@WebComponent({
  selector: 'docs-sidenav',
  styleUrl: './docs-sidenav.xd.component.css',
  templateUrl: './docs-sidenav.xd.component.html'
})
export class DocsSidenavComponent extends CustomElement {
  /**
   * The groups currently expanded, by key.
   */
  public readonly expanded = signal<ReadonlySet<string>>(new Set());

  /**
   * Expands the group of the page being read, whenever another page is displayed.
   */
  public onInit(): void {
    this.effect(() => {
      const current = path();
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
