import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal, untracked } from '@xaendar/core/signals';
import { navPath } from '../../core/router/router';
import type { NavGroup, NavSection } from '../../core/routes/routes';
import { NAV } from '../../core/routes/routes';

/**
 * The navigation of the documentation, in columns: the sections, replaced by the entries of the one selected, and
 * the pages of the group opened, in a column of their own on its right.
 * Whenever another page is displayed, its section is selected and its group opened.
 */
@WebComponent({
  selector: 'docs-sidenav',
  styleUrl: './docs-sidenav.xd.component.css',
  templateUrl: './docs-sidenav.xd.component.html'
})
export class DocsSidenavComponent extends CustomElement {
  /**
   * The section whose entries are shown, `null` to show the sections.
   */
  public readonly selected = signal<NavSection | null>(null);
  /**
   * The group whose pages are shown in the second column, `null` when it is closed.
   */
  public readonly opened = signal<NavGroup | null>(null);
  /**
   * The section of the page being read, `undefined` for the pages outside the navigation (the home page).
   */
  public readonly currentSection = computed(() => this._computeCurrentSection());
  /**
   * The group of the page being read, `undefined` when it is not in a group.
   */
  public readonly currentGroup = computed(() => this._computeCurrentGroup());

  /**
   * Selects the section and opens the group of the page being read, whenever another page is displayed.
   */
  public onInit(): void {
    this.effect(() => {
      navPath();
      const section = this.currentSection();
      const group = this.currentGroup();
      untracked(() => {
        this.selected.set(section ?? null);
        this.opened.set(group ?? null);
      });
    });
  }

  /**
   * Shows the entries of a section in place of the sections.
   *
   * @param section - The section.
   */
  public select(section: NavSection): void {
    this.selected.set(section);
    this.opened.set(null);
  }

  /**
   * Goes back to the sections.
   */
  public back(): void {
    this.selected.set(null);
    this.opened.set(null);
  }

  /**
   * Opens the pages of a group in the second column, or closes them if they are already open.
   *
   * @param item - The group.
   */
  public toggle(item: NavGroup): void {
    this.opened.update(opened => opened === item ? null : item);
  }

  /**
   * Closes the column of the pages of the group.
   */
  public close(): void {
    this.opened.set(null);
  }

  /**
   * Computes the value of `currentSection`.
   *
   * @returns The section listing the page being read.
   */
  private _computeCurrentSection(): NavSection | undefined {
    const current = navPath();
    return NAV.find(section => section.items.some(item => item.page?.path === current || item.pages?.some(page => page.path === current)));
  }

  /**
   * Computes the value of `currentGroup`.
   *
   * @returns The group listing the page being read.
   */
  private _computeCurrentGroup(): NavGroup | undefined {
    const current = navPath();
    return this.currentSection()?.items.find((item): item is NavGroup => !!item.pages?.some(page => page.path === current));
  }
}
