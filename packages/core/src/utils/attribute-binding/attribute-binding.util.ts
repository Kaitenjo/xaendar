import { COMPONENT } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import { _bindSite } from '../../signals/effect/effect';
import type { BindingHost } from '../../types/binding-host.type';
import type { _Context } from '../../types/context.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { RenderElementConditionalBinding } from '../../types/render-element-conditional-binding.type';
import type { RenderElementDirective } from '../../types/render-element-directive.type';
import type { RenderElement } from '../../types/render-element.type';
import type { TemplateExpression } from '../../types/template-expression.type';
import { createAttributeState, ensureAttributeState, getAttributeState, hostWritesAttribute, keepTemplateValue, mergesAllAttributes, removeAttributeOpinion, setAttributeOpinion } from '../attribute-state/attribute-state.util';
import { _getDirective } from '../directive-registry/directive-registry.util';
import { getElementSources } from '../element-sources/element-sources.util';
import { _hostAttributeNames } from '../host-attributes/host-attributes.util';
import { _checkUrl } from '../url-check/url-check.util';
import { _resolveDirective } from '../resolve-directive/resolve-directive.util';
import { writeAttribute } from '../write-attribute/write-attribute.util';

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
 * state up, and any attribute on the server, which merges all of them (see `_mergeAttributes`). An attribute holding a
 * URL the compiler flags (`RenderElementAttribute.url`) has its value checked first (see `_checkUrl`).
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @param bound - The value bound to it.
 */
export function writeTemplateAttribute(element: Element, attribute: RenderElementAttribute, bound: unknown): void {
  const { name, url } = attribute;
  const value = url ? _checkUrl(name, bound, url) : bound;
  if (!attribute.shared && !mergesAllAttributes()) {
    writeAttribute(element, name, value);
    return;
  }

  let state = getAttributeState(element, name);
  const record = state ? undefined : getElementSources(element);
  // An element whose attributes are all merged keeps the value, and merges it once a second level writes the attribute
  if (record?.template) {
    hostWritesAttribute(element, name) ? state = createAttributeState(element, name) : keepTemplateValue(record, attribute, value);
  }

  state ? setAttributeOpinion(element, state, attribute, 0, value) : writeAttribute(element, name, value);
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
  state ? removeAttributeOpinion(element, state, attribute) : element.removeAttribute(attribute.name);
}

/**
 * Creates, before the bindings of an element are applied, the states merging the sources of the attributes its template
 * writes, other than `class` and `style`, that the component it is or the directives it applies write too, or may write
 * later (see `RenderElement.shared`): the ones the classes of the component and of the directives, the ones the branches
 * of its conditional bindings apply included, declare as host attributes (see `_hostAttributeNames`), and every one of
 * them on a custom element whose class is not defined yet, or when a branch applies a directive not registered yet.
 *
 * N.B. Deliberate, to save memory: the state is created when the element is rendered, for the attributes a second level
 * declares, because the value the template binds to an attribute is kept nowhere else, and the directives of the
 * branches are resolved then, so that an attribute no host attribute declares gets no state. Do not create the state of
 * every attribute flagged as shared, nor create it lazily for the template.
 *
 * @param element - The element.
 * @param config - The element as the template describes it, whose `shared` is set.
 * @throws When no custom directive is registered for the selector of a directive of the element.
 */
export function _prepareAttributes(element: Element, config: RenderElement): void {
  const names = config.shared!;
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    if (declaresHostAttribute(element, name, config.directives) || (config.sharedAlways && branchDeclares(config.conditionalBindings, name))) {
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

/**
 * Tells whether a directive the branches of conditional bindings apply, nested ones included, writes an attribute with a
 * host attribute: any attribute for a directive not registered yet, which the branch resolves only once selected.
 *
 * @param conditionalBindings - The conditional bindings.
 * @param name - The name of the attribute.
 * @returns `true` when one may write it.
 */
function branchDeclares(conditionalBindings: readonly RenderElementConditionalBinding[] | undefined, name: string): boolean {
  if (conditionalBindings?.length) {
    for (let i = 0; i < conditionalBindings.length; i++) {
      const { branches } = conditionalBindings[i];
      for (let j = 0; j < branches.length; j++) {
        const { directives, conditionalBindings: nested } = branches[j];
        if (directivesDeclare(directives, name) || branchDeclares(nested, name)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Tells whether directives write an attribute with a host attribute: any attribute for a directive not registered yet.
 *
 * @param directives - The directives.
 * @param name - The name of the attribute.
 * @returns `true` when one may write it.
 */
function directivesDeclare(directives: readonly RenderElementDirective[] | undefined, name: string): boolean {
  if (directives?.length) {
    for (let i = 0; i < directives.length; i++) {
      const { selector } = directives[i];
      const Directive = typeof selector === 'string' ? _getDirective(selector) : selector;
      if (!Directive || _hostAttributeNames(Directive)?.includes(name)) {
        return true;
      }
    }
  }

  return false;
}
