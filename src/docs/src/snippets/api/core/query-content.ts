// tab-group.xd.component.ts
/**
 * Tabs built from the panels the parent projects into the group.
 */
@WebComponent({
  selector: 'ex-tab-group',
  templateUrl: './tab-group.xd.component.html'
})
export class TabGroupComponent extends CustomElement {
  /**
   * Every projected panel, typed as its class: empty until the parent creates the content.
   */
  @Query.content.all(TabPanelComponent)
  public accessor panels!: QuerySignal<TabPanelComponent[]>;
  /**
   * The label of each tab, following the panels as they arrive.
   */
  public readonly labels = computed(() => this._computeLabels());

  /**
   * Computes the value of `labels`.
   *
   * @returns The label of each panel.
   */
  private _computeLabels(): string[] {
    return this.panels().map(panel => panel.label());
  }
}
