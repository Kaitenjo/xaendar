/**
 * A panel closed by the Escape key, wherever the focus is.
 */
export class ShortcutsComponent extends CustomElement {
  /**
   * Whether the panel is open.
   */
  public readonly open = signal(false);
  /**
   * Closes the panel on Escape. A stable reference, so that the same function can be removed.
   */
  private readonly _onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.open.set(false);
    }
  };

  /**
   * Starts listening to the keyboard.
   */
  public onInit(): void {
    window.addEventListener('keydown', this._onKeydown);
  }

  /**
   * Stops listening: the window outlives the component.
   */
  public onDestroy(): void {
    window.removeEventListener('keydown', this._onKeydown);
  }
}
