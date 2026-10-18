// tint.directive.ts
/**
 * A custom directive, applied with @@exTint: it acts on the element.
 */
@Directive({ selector: 'exTint' })
export class TintDirective extends CustomDirective<HTMLElement> {
  /**
   * The background color.
   */
  @Property('#fde68a')
  public accessor color!: InputSignal<string>;

  /**
   * Keeps the background in sync with the input.
   */
  public onInit(): void {
    this.effect(() => {
      this.element.style.backgroundColor = this.color();
    });
  }
}

// visible-when.directive.ts
/**
 * A structural directive, applied with *exVisibleWhen: it decides whether the element exists.
 */
@Directive({ selector: 'exVisibleWhen' })
export class VisibleWhenDirective extends StructuralDirective {
  /**
   * Whether the element is rendered.
   */
  @Property(false)
  public accessor condition!: InputSignal<boolean>;

  /**
   * Evaluated again whenever the condition changes.
   *
   * @returns The condition.
   */
  public shouldRender(): boolean {
    return this.condition();
  }
}
