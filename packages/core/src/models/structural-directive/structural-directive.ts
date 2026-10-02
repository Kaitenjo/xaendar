/**
 * Base class for structural directives: directives deciding whether the element they are
 * applied to, along with its whole subtree, is rendered at all.
 *
 * A structural directive may declare inputs via `@Property`, but no output via `@Event`:
 * it holds no element to dispatch them on, since the element may not be rendered.
 *
 * The template runtime evaluates {@link StructuralDirective.shouldRender} inside an effect,
 * so it is evaluated again whenever a signal it reads changes: the element is rendered while
 * every structural directive applied to it returns `true`, and destroyed otherwise.
 *
 * @example
 * ```ts
 * @Directive({ selector: 'hasRole' })
 * class HasRoleDirective extends StructuralDirective {
 *   @Property.required()
 *   public accessor role!: InputSignal<string>;
 *
 *   public shouldRender(): Promise<boolean> {
 *     const role = this.role();
 *     return userService.hasRole(role);
 *   }
 * }
 * ```
 */
export abstract class StructuralDirective {
  /**
   * Tells whether the element the directive is applied to has to be rendered.
   *
   * It may be asynchronous: the element is rendered or destroyed once the returned promise
   * settles, unless it is evaluated again in the meantime. Only the signals read before
   * the first `await` are tracked, so the inputs should be read synchronously.
   *
   * @returns `true` to render the element, `false` to destroy it, or a promise resolving to one of them.
   */
  public abstract shouldRender(): boolean | Promise<boolean>;
}
