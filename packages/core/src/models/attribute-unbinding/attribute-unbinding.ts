import type { BindingHost } from '../../types/binding-host.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { _RenderElementBinding } from '../../types/render-element-binding.type';
import type { _Context } from '../../types/context.type';

/**
 * Unbinds the attributes of a branch of a conditional binding, once the branch is no longer the selected one or its
 * context is cleared: each attribute declaring an `unbind` removes its attribute, resets its property or removes its
 * class, in the order they are declared.
 *
 * N.B. Deliberate, to save memory: one cleanup object per branch applied, registered in the context of the branch and
 * disposed with `dispose()`, instead of an arrow per attribute capturing the target and the name. Do not register a
 * closure per attribute.
 */
export class AttributeUnbinding {
  /**
   * Creates the cleanup of the attributes of a branch.
   *
   * @param _context - The context of the branch.
   * @param _target - The element, or the directive, the attributes are bound to.
   * @param _attributes - The attributes of the branch, the constants of the module of the template.
   */
  constructor(
    private readonly _context: _Context,
    private readonly _target: Element | BindingHost,
    private readonly _attributes: readonly _RenderElementBinding[]
  ) { }

  /**
   * Unbinds the attributes declaring an `unbind`.
   */
  public dispose(): void {
    for (let i = 0; i < this._attributes.length; i++) {
      const attribute = this._attributes[i];
      (attribute.unbind as RenderElementAttribute['unbind'])?.(this._context, this._target, attribute as RenderElementAttribute);
    }
  }
}
