import { COMPONENT } from '../../costants';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import { CustomElement } from '../../models/custom-element/custom-element';
import { _bindSite } from '../../signals/effect/effect';
import type { BindingHost } from '../../types/binding-host.type';
import type { _Context } from '../../types/context.type';
import type { RenderElementDirective } from '../../types/render-element-directive.type';
import type { _RenderStyling } from '../../types/styling/render-styling.type';
import type { StylingOpinions } from '../../types/styling/styling-opinions.type';
import { _hostStylingFlags } from '../host-styling/host-styling.util';
import { _resolveDirective } from '../resolve-directive/resolve-directive.util';
import { keyOpinion, stringOpinions, toExactLength } from '../styling-opinions/styling-opinions.util';
import { applyDirectStyling, ensureStylingState, findStylingSource, getStylingState, removeStylingSource, setStylingSource, writeStylingAttribute } from '../styling-state/styling-state.util';

/**
 * Writes the static `class` or `style` of an element, without expressions (`<div class="card wide">`), once.
 *
 * @param _context - The current template execution scope.
 * @param target - The element.
 * @param styling - The binding, holding the static string.
 */
export function _setStyling(_context: _Context, target: Element | BindingHost, styling: _RenderStyling): void {
  writeStyling(target as Element, styling, undefined, undefined);
}

/**
 * Writes the `class` or the `style` of an element by the values of the expressions of the binding (see
 * `_RenderStyling`): once for expressions reading nothing that can change, a literal, or any expression on the server,
 * which reads every value once. It is the callback of the binding of {@link _setReactiveStyling} too.
 *
 * The keys bound one by one win over the string. When the element is written by this binding alone, only the keys whose
 * value changes from the values computed last are written, the binding keeping them in the slot after the one of the
 * element; otherwise the binding is a source of the state of the element, merged with the directives and the
 * component writing the same attribute (see `StylingState`).
 *
 * @param context - The current template execution scope, which the expressions read.
 * @param target - The element, or, for a binding keeping its values (see `BindingSite.indexed`), the index of the slot
 *   holding it.
 * @param styling - The binding.
 */
export function _setExpressionStyling(context: _Context, target: Element | BindingHost | number, styling: _RenderStyling): void {
  const values = evaluate(context, styling);
  if (typeof target !== 'number') {
    writeStyling(target as Element, styling, undefined, values);
    return;
  }

  const previous = context[target + 1];
  // `null` tells the values of a run from the empty slot of a binding never run
  context[target + 1] = values ?? null;
  writeStyling(context[target] as Element, styling, previous, values);
}

/**
 * Writes the `class` or the `style` of an element by the values of the expressions of the binding, again whenever a
 * signal or a variable of the template they read changes (see `_bindSite`), its callback being
 * {@link _setExpressionStyling}. E.g., `<div class="{kind()}" [class.active]="{active()}"></div>`.
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
  const state = getStylingState(element, styling.name);
  if (state) {
    removeStylingSource(state, element, styling);
  }
}

/**
 * Creates, before the bindings of an element are applied, the states merging the sources of its `class` and of its
 * `style` that another source than its template writes, or may write later, as the compiler flags them (see
 * `RenderElement.styling`):
 * - `1` and `2`: the template writes `class` (`style`) on the element and in the branches of its conditional bindings,
 *   or through directives they apply, or the element applies structural directives;
 * - `4` and `8`: the template writes `class` (`style`) on a custom element or on an element applying directives,
 *   which write it too when their classes declare host properties on it (`_hostStylingFlags`), as a custom element not
 *   defined yet may.
 *
 * N.B. Deliberate, to save memory: the state is created when the element is rendered, as soon as a second source is
 * certain or possible, because the bindings of the template could not be found from the element once a directive or the
 * component wrote it, without keeping in every element a reference to its template. An element written by its template
 * alone keeps no state. Do not create the state lazily for the template.
 *
 * @param element - The element.
 * @param styling - The flags of the element.
 * @param directives - The custom directives the element applies.
 * @throws When no custom directive is registered for the selector of a directive.
 */
export function _prepareStyling(element: Element, styling: number, directives?: readonly RenderElementDirective[]): void {
  let create = styling & 3;
  const check = styling >> 2;
  if (check) {
    let flags = hostFlags(element);
    if (directives?.length) {
      for (let i = 0; i < directives.length; i++) {
        flags |= _hostStylingFlags(_resolveDirective(directives[i].selector, CustomDirective));
      }
    }

    create |= flags & check;
  }

  if (create & 1) {
    ensureStylingState(element, 'class');
  }

  if (create & 2) {
    ensureStylingState(element, 'style');
  }
}

/**
 * Gives the attributes merged key by key the element a template renders writes as a component: the flags of its class
 * (see `_hostStylingFlags`), both for a custom element not defined yet, which may become a component declaring them.
 *
 * @param element - The element.
 * @returns The flags: `1` for `class`, `2` for `style`.
 */
function hostFlags(element: Element): number {
  if (element instanceof CustomElement) {
    return _hostStylingFlags(element.constructor);
  }

  return element.localName.includes('-') && !customElements.get(element.localName) ? 3 : 0;
}

/**
 * Writes the opinions of a binding of the template, computed from the values of its expressions: as a source of the
 * state of the element, when it has one; otherwise directly, the whole attribute at once on an element not holding it
 * at the first run, then only the keys whose value changes.
 *
 * @param element - The element.
 * @param styling - The binding.
 * @param previous - The values computed by the last run, `undefined` before the first run.
 * @param values - The values of this run.
 */
function writeStyling(element: Element, styling: _RenderStyling, previous: unknown, values: unknown): void {
  const attribute = styling.name;
  const keys = keysOf(styling, values);
  const string = stringOf(styling, values);
  const state = getStylingState(element, attribute);
  if (state) {
    setStylingSource(state, element, findStylingSource(state, styling) ?? { owner: styling, tier: 0, order: 0, keys: null, string: null }, keys, string);
    return;
  }

  if (previous !== undefined) {
    applyDirectStyling(element, attribute, keysOf(styling, previous), stringOf(styling, previous), keys, string);
  } else if (element.hasAttribute(attribute)) {
    // An element adopted from the HTML of the server: only what it does not hold is written
    applyDirectStyling(element, attribute, null, null, keys, string);
  } else if (styling.text !== undefined && !keys) {
    element.setAttribute(attribute, styling.text);
  } else {
    writeStylingAttribute(element, attribute, keys, string);
  }
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

/**
 * Gives the opinions of the string of a binding: its static string, parsed by the compiler, or the value of its
 * expression.
 *
 * @param styling - The binding.
 * @param values - The values of its expressions (see {@link evaluate}).
 * @returns The opinions, `null` for none.
 */
function stringOf({ name, statics, string, values: expressions }: _RenderStyling, values: unknown): StylingOpinions | null {
  if (statics) {
    return statics;
  }

  if (!string) {
    return null;
  }

  return stringOpinions(name, expressions ? (values as unknown[])[0] : values);
}

/**
 * Gives the opinions of the keys a binding binds one by one, by the values of their expressions.
 *
 * @param styling - The binding.
 * @param values - The values of its expressions (see {@link evaluate}).
 * @returns The opinions, `null` for none.
 */
function keysOf({ name, string, keys, units }: _RenderStyling, values: unknown): StylingOpinions | null {
  if (!keys) {
    return null;
  }

  const single = !string && keys.length === 1;
  const offset = string ? 1 : 0;
  let opinions: Array<string | boolean> | null = null;
  for (let i = 0; i < keys.length; i++) {
    const value = single ? values : (values as unknown[])[offset + i];
    const opinion = keyOpinion(name, value, units?.[i] ?? '');
    if (opinion !== undefined) {
      opinions ? opinions.push(keys[i], opinion) : opinions = [keys[i], opinion];
    }
  }

  return opinions && toExactLength(opinions);
}
