/**
 * A card loading its user whenever the id changes.
 */
@WebComponent({ selector: 'ex-user-card', templateUrl: './user-card.xd.component.html' })
export class UserCardComponent extends CustomElement {
  /**
   * The id of the user to show.
   */
  @Property(0)
  public accessor userId!: InputSignal<number>;
  /**
   * The loaded user, null until the first response.
   */
  public readonly user = signal<User | null>(null);
  /**
   * Aborts the request in flight.
   */
  private _controller: AbortController | null = null;

  /**
   * Loads the user again whenever userId changes.
   */
  public onInit(): void {
    // In onInit the input still holds its default value:
    // the bound one arrives right after, and its request aborts this first one.
    this.effect(() => {
      const id = this.userId();
      untracked(() => this._load(id));
    });
  }

  /**
   * Loads a user, aborting the previous request.
   *
   * @param id - The id of the user.
   */
  private async _load(id: number): Promise<void> {
    this._controller?.abort();
    const controller = new AbortController();
    this._controller = controller;
    try {
      this.user.set(await fetchUser(id, controller.signal));
    } catch {
      // Aborted, or failed: see the full example above for the error state
    }
  }

  /**
   * Aborts the request in flight, whose response nobody would read.
   */
  public onDestroy(): void {
    this._controller?.abort();
  }
}
