import { COMPONENT } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import { _bindSite } from '../../signals/effect/effect';
import type { BindingHost } from '../../types/binding-host.type';
import type { _Context } from '../../types/context.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { RenderElementDirective } from '../../types/render-element-directive.type';
import type { SourceRank } from '../../types/source-rank.type';
import type { TemplateExpression } from '../../types/template-expression.type';
import { ensureAttributeState, findAttributeState, getAttributeState, mergesAllAttributes, removeAttributeOpinion, setAttributeOpinion } from '../attribute-state/attribute-state.util';
import { _hostAttributeNames } from '../host-attributes/host-attributes.util';
import { _resolveDirective } from '../resolve-directive/resolve-directive.util';
import { writeAttribute } from '../write-attribute/write-attribute.util';

/**
 * The rank of the attributes a template writes: the strongest level.
 */
const TEMPLATE_RANK: SourceRank = Object.freeze({ tier: 0, order: 0 });

/**
 * Writes the static value of an attribute written with `attr.` (`attr.title="Close"`), once: always the attribute of the
 * element, never an input of its component, whatever its name.
 *
 * @param _context - The current template execution scope.
 * @param target - The element.
 * @param attribute - The attribute, whose value is the literal.
 */
export function _setAttribute(_context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  writeTemplateAttribute(target as Element, attribute, attribute.value);
}

/**
 * Writes an attribute written with `attr.` (see {@link _setAttribute}) by the value of an expression reading nothing that
 * can change, once: a literal, or any expression on the server, which reads every value once. It is the callback of the
 * binding of {@link _setReactiveAttribute} too.
 *
 * @param context - The current template execution scope, which the expression reads.
 * @param target - The element.
 * @param attribute - The attribute, whose value is the expression.
 */
export function _setExpressionAttribute(context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  writeTemplateAttribute(target as Element, attribute, (attribute.value as TemplateExpression<unknown>).call(context[COMPONENT], context));
}

/**
 * Writes an attribute written with `attr.` (see {@link _setAttribute}) by the value of an expression, again whenever a
 * signal or a variable of the template it reads changes (see `_bindSite`), its callback being
 * {@link _setExpressionAttribute}. E.g., `<app-dialog attr.title="{ hint() }"></app-dialog>`.
 *
 * @param context - The current template execution scope, which the expression reads and which disposes the binding.
 * @param target - The element.
 * @param attribute - The attribute, whose value is the expression, and whose `reads` lists the variables of the template
 *   it reads, if any.
 */
export function _setReactiveAttribute(context: _Context, target: Element | BindingHost, attribute: RenderElementAttribute): void {
  _bindSite(context, attribute, target, _setExpressionAttribute);
}

/**
 * Writes the value a template binds to an attribute of an element: as the opinion of the template in the state of the
 * attribute, when the attribute is merged with the directives and the component writing it, otherwise directly (see
 * `writeAttribute`). Only an attribute the compiler flags as shared (see `RenderElementAttribute.shared`) looks its
 * state up, and any attribute on the server, which merges all of them (see `_mergeAttributes`).
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @param value - The value.
 */
export function writeTemplateAttribute(element: Element, attribute: RenderElementAttribute, value: unknown): void {
  const state = attribute.shared || mergesAllAttributes() ? findAttributeState(element, attribute.name) : undefined;
  state ? setAttributeOpinion(state, element, attribute, TEMPLATE_RANK, value) : writeAttribute(element, attribute.name, value);
}

/**
 * Removes the value a template bound to an attribute of an element, when the branch binding it is no longer selected:
 * the state of the attribute writes again the value of the sources below, if it is merged, otherwise the attribute is
 * removed.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 */
export function removeTemplateAttribute(element: Element, attribute: RenderElementAttribute): void {
  const state = attribute.shared ? getAttributeState(element, attribute.name) : undefined;
  state ? removeAttributeOpinion(state, element, attribute) : element.removeAttribute(attribute.name);
}

/**
 * Creates, before the bindings of an element are applied, the states merging the sources of the attributes its template
 * writes, other than `class` and `style`, that the component it is or the directives it applies write too, or may write
 * later (see `RenderElement.shared`): every one of them when a branch of its conditional bindings applies directives,
 * or the element is a custom element whose class is not defined yet, otherwise the ones the classes of the component and
 * of the directives declare as host attributes (see `_hostAttributeNames`).
 *
 * N.B. Deliberate, to save memory: the state is created when the element is rendered, as soon as a second source is
 * certain or possible, because the bindings of the template could not be found from the element once a directive or the
 * component wrote it, without keeping in every element a reference to its template. An element written by its template
 * alone keeps no state. Do not create the state lazily for the template.
 *
 * @param element - The element.
 * @param names - The attributes the template writes, which other sources may write.
 * @param always - Whether a branch of a conditional binding applies directives.
 * @param directives - The custom directives the element applies.
 * @throws When no custom directive is registered for the selector of a directive.
 */
export function _prepareAttributes(element: Element, names: readonly string[], always: boolean, directives?: readonly RenderElementDirective[]): void {
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (always || declaresHostAttribute(element, name, directives)) {
      ensureAttributeState(element, name);
    }
  }
}

/**
 * Tells whether the component an element is, or a directive it applies, writes an attribute with a host attribute: any
 * attribute for a custom element whose class is not defined yet, which may become a component declaring it.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @param directives - The custom directives the element applies.
 * @returns `true` when one may write it.
 * @throws When no custom directive is registered for the selector of a directive.
 */
function declaresHostAttribute(element: Element, name: string, directives: readonly RenderElementDirective[] | undefined): boolean {
  if (element instanceof CustomElement) {
    if (_hostAttributeNames(element.constructor)?.includes(name)) {
      return true;
    }
  } else if (element.localName.includes('-') && !customElements.get(element.localName)) {
    return true;
  }

  if (directives?.length) {
    for (let i = 0; i < directives.length; i++) {
      if (_hostAttributeNames(_resolveDirective(directives[i].selector, CustomDirective))?.includes(name)) {
        return true;
      }
    }
  }

  return false;
}
