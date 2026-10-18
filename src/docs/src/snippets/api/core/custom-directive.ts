// copy.directive.ts
/**
 * Copies a text to the clipboard when the element is clicked.
 */
@Directive({ selector: 'exCopy' })
export class CopyDirective extends CustomDirective<HTMLButtonElement> {
  /**
   * The text to copy.
   */
  @Property.required()
  public accessor text!: InputSignal<string>;
  /**
   * Emitted on the element once the text is in the clipboard, with the text as detail.
   */
  @Event()
  public accessor copied!: Output<string>;
  /**
   * Copies the text: a stable reference, so that the same function can be removed.
   */
  private readonly _copy = async (): Promise<void> => {
    const text = this.text();
    await navigator.clipboard.writeText(text);
    this.copied.emit(text);
  };

  /**
   * Here the element is set, the inputs are bound and the listeners of the template are in place.
   */
  public onInit(): void {
    this.element.addEventListener('click', this._copy);
    this.effect(() => {
      this.element.title = `Copy "${this.text()}"`;
    });
  }

  /**
   * Leaves the element as it found it. The effect is disposed right after, on its own.
   */
  public onDestroy(): void {
    this.element.removeEventListener('click', this._copy);
    this.element.removeAttribute('title');
  }
}
