export class ShortcutsComponent extends CustomElement {
  public readonly open = signal(false);

  // A stable reference, so that the same function can be removed
  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.open.set(false);
    }
  };

  public onInit(): void {
    window.addEventListener('keydown', this.onKeydown);
  }

  public onDestroy(): void {
    window.removeEventListener('keydown', this.onKeydown);
  }
}
