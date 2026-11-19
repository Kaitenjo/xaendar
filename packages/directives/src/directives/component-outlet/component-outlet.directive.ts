import { ComponentRef, CreateComponentOptionsWithOptionalTarget, CustomDirective, CustomElement, Directive, Property } from '@xaendar/core';
import { InputSignal } from '@xaendar/core/signals';
import { Constructor } from '@xaendar/types';

/**
 * Creates dynamically a component in the DOM and appends it to the element the directive is applied to, or to the `target`
 * of its options. The component is created again when the class or the options change, and destroyed with the directive.
 *
 * @template T - The component to create.
 */
@Directive({
  selector: 'componentOutlet'
})
export class ComponentOutlet<T extends CustomElement> extends CustomDirective {
  /**
   * The class of the component to create dynamically.
   */
  @Property.required()
  public accessor component!: InputSignal<Constructor<T>>;
  /**
   * The options the component is created with: the bindings of its inputs and of its events, its directives and its content.
   * Without `target`, the component is appended to the element the directive is applied to.
   */
  @Property<InputSignal<CreateComponentOptionsWithOptionalTarget<T> | undefined>>(undefined)
  public accessor options!: InputSignal<CreateComponentOptionsWithOptionalTarget<T> | undefined>;
  /**
   * The reference to the component created. It is used to destroy and dispose the instance correctly when:
   * - the class of the component changes
   * - the options change
   * - the directive is destroyed
   */
  private _componentRef: ComponentRef<T> | null = null;

  /**
   * Registers the effect creating the component with the options given, destroying the previous one first.
   */
  public onInit(): void {
    this.effect(() => {
      this._componentRef?.destroy();
      this._componentRef = this.createComponent(this.component(), this.options());
    });
  }

  /**
   * Destroys the component created, if any.
   */
  public onDestroy(): void {
    this._componentRef?.destroy();
  }
}
