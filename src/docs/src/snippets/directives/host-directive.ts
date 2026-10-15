// field.xd.component.ts
@WebComponent({
  selector: 'ex-field',
  hostDirectives: [{ directive: TooltipDirective, properties: [{ name: 'text', alias: 'hint' }], events: ['shown'] }],
  templateUrl: './field.xd.component.html'
})
export class FieldComponent extends CustomElement {
  /**
   * The tooltip applied to the element, which the template reads from here.
   */
  public readonly tooltip = this.hostDirectives.get(TooltipDirective);

  /**
   * Logs the text of the tooltip each time it changes.
   */
  public onInit(): void {
    this.effect(() => console.log(this.tooltip?.text()));
  }
}
