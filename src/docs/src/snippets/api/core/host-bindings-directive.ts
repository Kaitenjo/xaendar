// copy.directive.ts
/**
 * Copies a text to the clipboard when the element is clicked. The listener and the title are bound to the element by
 * the decorators: no onInit, and nothing to undo in onDestroy.
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
   * The title of the element, written again when the text changes, and removed when the directive is destroyed.
   *
   * @returns The tooltip of the element.
   */
  @HostProperty('title')
  public get hint(): string {
    return `Copy "${this.text()}"`;
  }

  /**
   * Copies the text. Listens to the clicks on the element until the directive is destroyed.
   */
  @HostEvent('click')
  public async copy(): Promise<void> {
    const text = this.text();
    await navigator.clipboard.writeText(text);
    this.copied.emit(text);
  }
}
