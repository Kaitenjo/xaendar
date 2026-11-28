import { COMPONENT } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import { _bindSite } from '../../signals/effect/effect';
import type { BindingHost } from '../../types/binding-host.type';
import type { _Context } from '../../types/context.type';
import type { ElementSources } from '../../types/element-sources.type';
import type { RenderElementConditionalBinding } from '../../types/render-element-conditional-binding.type';
import type { RenderElementDirective } from '../../types/render-element-directive.type';
import type { RenderElement } from '../../types/render-element.type';
import type { _RenderStyling } from '../../types/styling/render-styling.type';
import type { TemplateStyling } from '../../types/styling/template-styling.type';
import { _getDirective } from '../directive-registry/directive-registry.util';
import { getElementSources } from '../element-sources/element-sources.util';
import { _hostStylingFlags } from '../host-styling/host-styling.util';
import { _resolveDirective } from '../resolve-directive/resolve-directive.util';
import { templateKeys, templateString } from '../styling-opinions/styling-opinions.util';
import { applyDirectStyling, createStylingState, ensureStylingState, keepTemplateStyling, keptValues, markStyling, removeStylingSource, setTemplateStyling, sharesNewKey, writeStylingAttribute, writeStylingText } from '../styling-state/styling-state.util';


/**
 * The shift from the flags of the `class`, the `style` and the `part` of an element another source of its template
 * writes (`1`, `2`, `4`) to the flags of the ones its component or its directives may write (`8`, `16`, `32`), in the
 * `styling` of an element (see `RenderElement.styling`).
 *
 * N.B. Equal to the one of the compiler (`STYLING_SHIFT` of its `styling.utils.ts`), which writes the flags: change
 * both together.
 */
const STYLING_SHIFT = 3;
/**
 * The most strings the cache of the values of `class` and `style` holds (see `internStyling`): enough for the distinct
 * texts of the classes and the styles of an application, few enough that the cache stays small. Once it is full, a new
 * string is kept as it is, and the cache is never emptied, so that the copies the slots share stay valid.
 */
const INTERNED_STRINGS = 512;

/**
 * The strings the expressions of `class` and `style` computed, each one by its text (see `internStyling`).
 */
const internedStrings = new Map<string, string>();

/**
 * Writes the static `class` or `style` of an element, without expressions (`<div class="card wide">`), once.
 *
 * @param _context - The current template execution scope.
 * @param target - The element.
 * @param styling - The binding, holding the static string.
 */
export function _setStyling(_context: _Context, target: Element | BindingHost, styling: _RenderStyling): void {
  writeStyling(target as Element, styling, undefined, undefined, false);
}

/**
 * Writes the `class` or the `style` of an element by the values of the expressions of the binding (see
 * `_RenderStyling`): once for expressions reading nothing that can change, a literal, or any expression on the server,
 * which reads every value once. It is the callback of the binding of {@link _setReactiveStyling} too.
 *
 * The keys bound one by one win over the string. Only the keys whose value changes from the values computed last are
 * written, the binding keeping them in the slot after the one of the element. When a directive or the component the
 * element is writes the same keys, the binding is a source of the state merging them (see `StylingState`).
 *
 * @param context - The current template execution scope, which the expressions read.
 * @param target - The element, or, for a binding keeping its values (see `BindingSite.indexed`), the index of the slot
 *   holding it.
 * @param styling - The binding.
 */
export function _setExpressionStyling(context: _Context, target: Element | BindingHost | number, styling: _RenderStyling): void {
  const values = evaluate(context, styling);
  if (typeof target !== 'number') {
    writeStyling(target as Element, styling, undefined, values, false);
    return;
  }

  // The values the slot keeps share the copy of an equal string the slot of another element keeps (see `internStyling`)
  if (Array.isArray(values)) {
    for (let i = 0; i < values.length; i++) {
      values[i] = internStyling(values[i]);
    }
  }

  const kept = Array.isArray(values) ? values : internStyling(values);
  const previous = context[target + 1];
  // `null` tells the values of a run from the empty slot of a binding never run
  context[target + 1] = kept ?? null;
  writeStyling(context[target] as Element, styling, previous, kept, true);
}

/**
 * Gives the copy of a string an expression of `class` or `style` computed that the slots of the bindings keep (see
 * `_setExpressionStyling`): the first equal string met, held by {@link internedStrings}, or the string itself once the
 * cache is full. Any other value is given as it is.
 *
 * N.B. Deliberate, to save memory: a method composing the classes of an element (`cellClass(column)`, joining an array)
 * returns a new string at every call, even with the same text, which the slot keeps as long as the element lives: a
 * table kept one copy per cell of every row. The cache keeps one copy per text, shared by every slot, and the `===` of
 * the next run compares two references. Do not keep the strings as they are computed, nor intern the other attributes.
 *
 * @param value - The value of an expression.
 * @returns The value, or the copy of the string the cache holds.
 */
export function internStyling(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const interned = internedStrings.get(value);
  if (interned !== undefined) {
    return interned;
  }

  if (internedStrings.size < INTERNED_STRINGS) {
    internedStrings.set(value, value);
  }

  return value;
}

/**
 * Tells how many strings the cache of {@link internStyling} holds: a helper of the tests.
 *
 * @returns The number of strings.
 */
export function _internedStylingCount(): number {
  return internedStrings.size;
}

/**
 * Writes the `class` or the `style` of an element by the values of the expressions of the binding, again whenever a
 * signal or a variable of the template they read changes (see `_bindSite`), its callback being
 * {@link _setExpressionStyling}. E.g., `<div class="{kind()}" class.active="{active()}"></div>`.
 *
 * @param context - The current template execution scope, which the expressions read and which disposes the binding.
 * @param target - The element.
 * @param styling - The binding.
 */
export function _setReactiveStyling(context: _Context, target: Element | BindingHost, styling: _RenderStyling): void {
  _bindSite(context, styling, target, _setExpressionStyling);
}

/**
 * Removes what a binding of a branch of a conditional binding wrote on the `class` or the `style` of an element, when
 * the branch is no longer selected: its source leaves the state of the element, which writes again the value of the
 * sources below.
 *
 * @param _context - The current template execution scope.
 * @param target - The element.
 * @param styling - The binding.
 */
export function _removeStyling(_context: _Context, target: Element | BindingHost, styling: _RenderStyling): void {
  const element = target as Element;
  if (Array.isArray(getElementSources(element)?.[styling.name])) {
    removeStylingSource(element, styling.name, styling);
  }
}

/**
 * Marks, before the bindings of an element are applied, its `class`, its `style` and its `part` that another source
 * than its own bindings may write (see `RenderElement.styling`), so that the binding of the template writing them keeps
 * itself in the sources of the element (see `StylingSlot`), where a host attribute writing one of its keys finds it:
 * - the branches of its conditional bindings writing them (`styling` of the branch), whose sources are merged in a
 *   state;
 * - the component it is and the directives it applies, the ones of its branches included, declaring host attributes on
 *   them (`_hostStylingFlags`), as a custom element not defined yet, or a directive not registered yet, may;
 * - for an element applying structural directives, whose bindings the runtime keeps without slots, both always.
 *
 * N.B. Deliberate, to save memory: the binding of the template is kept, as soon as a second source is possible, in place
 * of the state, which is created only once two sources have an opinion on the same key, because the bindings of the
 * template could not be found from the element once a directive or the component writes it, without keeping in every
 * element a reference to its template. An element written by its template alone keeps nothing. Do not create the state
 * when the element is rendered, nor keep the binding of every element.
 *
 * @param element - The element.
 * @param config - The element as the template describes it, whose `styling` is set.
 * @throws When no custom directive is registered for the selector of a directive of the element.
 */
export function _prepareStyling(element: Element, config: RenderElement): void {
  const { styling, directives } = config;
  const writes = (styling! | styling! >> STYLING_SHIFT) & 7;
  let marks = writes;
  if (!config.structuralDirectives?.length && !config.structuralConditionalBindings?.length) {
    let flags = hostFlags(element) | branchFlags(config.conditionalBindings);
    if (directives?.length) {
      for (let i = 0; i < directives.length; i++) {
        flags |= _hostStylingFlags(_resolveDirective(directives[i].selector, CustomDirective));
      }
    }

    marks &= flags;
  }

  if (marks & 1) {
    markStyling(element, 'class');
  }

  if (marks & 2) {
    markStyling(element, 'style');
  }

  if (marks & 4) {
    markStyling(element, 'part');
  }
}

/**
 * Gives the attributes merged key by key the element a template renders writes as a component: the flags of its class
 * (see `_hostStylingFlags`), all of them for a custom element not defined yet, which may become a component declaring
 * them.
 *
 * @param element - The element.
 * @returns The flags: `1` for `class`, `2` for `style`, `4` for `part`.
 */
function hostFlags(element: Element): number {
  if (element instanceof CustomElement) {
    return _hostStylingFlags(element.constructor);
  }

  return element.localName.includes('-') && !customElements.get(element.localName) ? 7 : 0;
}

/**
 * Gives the attributes merged key by key the branches of conditional bindings write, nested ones included: the ones
 * their bindings write, and the ones the directives they apply declare host attributes on, all of them for a directive
 * not registered yet, which the branch resolves only once selected.
 *
 * @param conditionalBindings - The conditional bindings.
 * @returns The flags: `1` for `class`, `2` for `style`, `4` for `part`.
 */
function branchFlags(conditionalBindings: readonly RenderElementConditionalBinding[] | undefined): number {
  let flags = 0;
  if (conditionalBindings?.length) {
    for (let i = 0; i < conditionalBindings.length; i++) {
      const { branches } = conditionalBindings[i];
      for (let j = 0; j < branches.length; j++) {
        const { styling, directives, conditionalBindings: nested } = branches[j];
        flags |= (styling ?? 0) | branchFlags(nested) | directiveFlags(directives);
      }
    }
  }

  return flags;
}

/**
 * Gives the attributes merged key by key directives declare host attributes on, all of them for a directive not
 * registered yet.
 *
 * @param directives - The directives.
 * @returns The flags: `1` for `class`, `2` for `style`, `4` for `part`.
 */
function directiveFlags(directives: readonly RenderElementDirective[] | undefined): number {
  let flags = 0;
  if (directives?.length) {
    for (let i = 0; i < directives.length; i++) {
      const { selector } = directives[i];
      const Directive = typeof selector === 'string' ? _getDirective(selector) : selector;
      flags |= Directive ? _hostStylingFlags(Directive) : 7;
    }
  }

  return flags;
}

/**
 * Writes the opinions of a binding of the template, computed from the values of its expressions:
 * - as a source of the state of the element, when it has one, and always for a branch of a conditional binding, which
 *   keeps no slot;
 * - on an element a host attribute may write (see {@link _prepareStyling}), keeping the binding in the sources of the
 *   element, and creating the state when one of its keys is one a host attribute has an opinion on;
 * - otherwise directly, the whole attribute at once on an element not holding it at the first run, then only the keys
 *   whose value changes.
 *
 * @param element - The element.
 * @param styling - The binding.
 * @param previous - The values computed by the last run, `undefined` before the first run or for a binding keeping no
 *   slot.
 * @param values - The values of this run.
 * @param indexed - Whether the binding keeps its values in a slot, giving the previous ones.
 */
function writeStyling(element: Element, styling: _RenderStyling, previous: unknown, values: unknown, indexed: boolean): void {
  const attribute = styling.name;
  const record = getElementSources(element);
  const slot = record?.[attribute];
  if (Array.isArray(slot) || styling.unbind) {
    setTemplateStyling(element, record ?? createSources(element, attribute), styling, values);
    return;
  }

  // A binding without slot reads its values in the sources of the element, where it kept them
  const kept = slot && slot !== true ? slot as TemplateStyling | _RenderStyling : undefined;
  if (kept && !indexed) {
    previous = keptValues(kept) ?? null;
  }

  const keys = templateKeys(styling, values);
  const string = templateString(styling, values);
  const previousKeys = previous === undefined ? null : templateKeys(styling, previous);
  const previousString = previous === undefined ? null : templateString(styling, previous);
  if (slot) {
    if (sharesNewKey(record!, attribute, styling, previousKeys, previousString, keys, string)) {
      createStylingState(element, attribute);
      setTemplateStyling(element, record!, styling, values);
      return;
    }

    keepTemplateStyling(record!, styling, values);
  }

  if (previous !== undefined) {
    applyDirectStyling(element, attribute, previousKeys, previousString, keys, string);
  } else if (element.hasAttribute(attribute)) {
    // An element adopted from the HTML of the server: only what it does not hold is written
    applyDirectStyling(element, attribute, null, null, keys, string);
  } else if (styling.text !== undefined && !keys) {
    writeStylingText(element, attribute, styling.text);
  } else {
    writeStylingAttribute(element, attribute, keys, string);
  }
}

/**
 * Creates the state merging the sources of an attribute of an element without record, for a branch of a conditional
 * binding writing it.
 *
 * @param element - The element.
 * @param attribute - The attribute.
 * @returns The sources of the element.
 */
function createSources(element: Element, attribute: _RenderStyling['name']): ElementSources {
  ensureStylingState(element, attribute);
  return getElementSources(element)!;
}

/**
 * Computes the values of the expressions of a binding: the one of the string, if any, then the ones of the keys.
 *
 * @param context - The scope the expressions read.
 * @param styling - The binding.
 * @returns The value of the only expression, or the values of all of them, in an array of the exact length.
 */
function evaluate(context: _Context, { string, values }: _RenderStyling): unknown {
  const component = context[COMPONENT];
  if (!values) {
    return string!.call(component, context);
  }

  if (!string && values.length === 1) {
    return values[0].call(component, context);
  }

  const offset = string ? 1 : 0;
  const computed = new Array<unknown>(offset + values.length);
  if (string) {
    computed[0] = string.call(component, context);
  }

  for (let i = 0; i < values.length; i++) {
    computed[offset + i] = values[i].call(component, context);
  }

  return computed;
}
