import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `constructor-access.ts`, shown by the page directives/custom and the API reference of core.
 */
export const CONSTRUCTOR_ACCESS: SourceFile = {
  name: 'constructor-access.ts',
  lang: 'ts',
  code: `/**
 * A directive doing its setup too early.
 */
@Directive({ selector: 'exEarly' })
export class EarlyDirective extends CustomDirective<HTMLElement> {
  /**
   * ✗ Reads the element before it is set.
   */
  public constructor() {
    super();
    console.log(this.element); // undefined: the element is set after the constructor
    this.effect(() => {});     // ✓ allowed: the effect is disposed with the directive
  }

  /**
   * ✓ Here the element, the inputs and the context are all in place.
   */
  public onInit(): void {
    console.log(this.element);
  }
}`
};

/**
 * The snippet `generic-directive.ts`, shown by the page directives/custom.
 */
export const GENERIC_DIRECTIVE: SourceFile = {
  name: 'generic-directive.ts',
  lang: 'ts',
  code: `// each.directive.ts
@Directive({ selector: 'exEach' })
export class EachDirective<Item extends { id: number }, Key = string> extends CustomDirective<HTMLElement> {
  @Property([]) accessor items!: InputSignal<Item[]>;
  @Event() accessor picked!: Output<Key>;
}`
};

/**
 * The snippet `host-directive.ts`, shown by the page directives/custom and the API reference of core.
 */
export const HOST_DIRECTIVE: SourceFile = {
  name: 'host-directive.ts',
  lang: 'ts',
  code: `// field.xd.component.ts
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
}`
};
