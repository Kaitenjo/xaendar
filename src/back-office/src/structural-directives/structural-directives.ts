import { Directive, Property, StructuralDirective } from '@xaendar/core';
import { InputSignal } from '@xaendar/core/signals';

/**
 * Names allowed by {@link AllowedUserDirective}.
 */
export const ALLOWED_USERS = ['Dario', 'Daniela', 'Michele', 'Federico', 'Silvano'];

/**
 * Renders the element only if `name` is one of the {@link ALLOWED_USERS}.
 *
 * The check is asynchronous, to simulate a call to a server.
 */
@Directive({
  selector: 'allowedUser'
})
export class AllowedUserDirective extends StructuralDirective {
  @Property.required()
  public accessor name!: InputSignal<string>;

  /**
   * Checks the name against the allowed ones after a simulated network delay.
   *
   * @returns A promise resolving to `true` if the name is allowed.
   */
  public shouldRender(): boolean {
    const name = this.name();
    return ALLOWED_USERS.includes(name);
  }
}

/**
 * Renders the element only if `value` is an even number.
 */
@Directive({
  selector: 'isEven'
})
export class IsEvenDirective extends StructuralDirective {
  @Property.required()
  public accessor value!: InputSignal<number>;

  /**
   * Checks whether the value is even.
   *
   * @returns `true` if the value is even.
   */
  public shouldRender(): boolean {
    return this.value() % 2 === 0;
  }
}

/**
 * Renders the element only if `value` is at least `min` characters long.
 */
@Directive({
  selector: 'minLength'
})
export class MinLengthDirective extends StructuralDirective {
  @Property.required()
  public accessor value!: InputSignal<string>;

  @Property(3)
  public accessor min!: InputSignal<number>;

  /**
   * Checks the length of the value.
   *
   * @returns `true` if the value has at least `min` characters.
   */
  public shouldRender(): boolean {
    return this.value().trim().length >= this.min();
  }
}
