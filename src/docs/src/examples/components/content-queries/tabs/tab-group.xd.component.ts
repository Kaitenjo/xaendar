import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';
import { TabPanelComponent } from './tab-panel.xd.component';

/**
 * A tab group: its tabs are built from the panels projected into it, found by a content query.
 */
@WebComponent({
  selector: 'ex-tab-group',
  templateUrl: './tab-group.xd.component.html',
  styleUrl: './tab-group.css'
})
export class TabGroupComponent extends CustomElement {
  /**
   * The index of the active panel.
   */
  public readonly activeIndex = signal(0);
  /**
   * The projected panels, typed as instances of the component.
   */
  @Query.content.all(TabPanelComponent)
  public accessor panels!: QuerySignal<TabPanelComponent[]>;
  /**
   * One tab for each panel, with the label the panel received from its parent.
   */
  public readonly tabs = computed(() => this._computeTabs());

  /**
   * Shows the active panel and hides the others, whenever the panels or the active index change.
   */
  public onInit(): void {
    this.effect(() => {
      const active = this.activeIndex();
      this.panels().forEach((panel, index) => panel.active.set(index === active));
    });
  }

  /**
   * Activates a panel.
   *
   * @param index - The index of the panel.
   */
  public select(index: number): void {
    this.activeIndex.set(index);
  }

  /**
   * Computes the value of `tabs`.
   *
   * @returns One tab for each panel, with the label the panel received from its parent.
   */
  private _computeTabs(): Array<{ index: number; label: string }> {
    return this.panels().map((panel, index) => ({ index, label: panel.label() }));
  }
}
