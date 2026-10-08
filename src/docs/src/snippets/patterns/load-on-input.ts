@WebComponent({ selector: 'ex-user-card', templateUrl: './user-card.xd.component.html' })
export class UserCardComponent extends CustomElement {
  @Property(0)
  public accessor userId!: InputSignal<number>;

  public readonly user = signal<User | null>(null);

  private controller: AbortController | null = null;

  public onInit(): void {
    // Runs again whenever userId changes. In onInit the input still holds its default value:
    // the bound one arrives right after, and its request aborts this first one.
    this.effect(() => {
      const id = this.userId();
      untracked(() => this.load(id));
    });
  }

  private async load(id: number): Promise<void> {
    this.controller?.abort();
    const controller = new AbortController();
    this.controller = controller;
    try {
      this.user.set(await fetchUser(id, controller.signal));
    } catch {
      // Aborted, or failed: see the full example above for the error state
    }
  }

  public onDestroy(): void {
    this.controller?.abort();
  }
}
