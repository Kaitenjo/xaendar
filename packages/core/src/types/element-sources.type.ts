import type { AttributeState } from './attributes/attribute-state.type';
import type { HostRun } from './host/host-run.type';
import type { StylingSlot } from './styling/styling-slot.type';

/**
 * What an element keeps of the sources writing its attributes, when more than one may write them (see
 * `getElementSources`): each member is `null` when the element has nothing of its kind.
 *
 * N.B. Deliberate, to save memory: one record per element, in a single `WeakMap`, instead of a map per kind of state
 * (each entry of a `WeakMap` costs), none for an element its template alone writes, nearly every one, and none for an
 * element holding a single host run, which the map keeps as it is. Do not split it into a map per kind again.
 */
export type ElementSources = {
  /**
   * What the element keeps of the sources of its `class`.
   */
  class: StylingSlot;
  /**
   * What the element keeps of the sources of its `style`.
   */
  style: StylingSlot;
  /**
   * The states of the attributes, other than `class` and `style`, two levels write: one, or an array of the exact length
   * from the second.
   */
  attributes: AttributeState | AttributeState[] | null;
  /**
   * The runs of host attributes bound on the element: one, or an array of the exact length from the second.
   */
  hosts: HostRun | HostRun[] | null;
  /**
   * The values the template bound to the attributes of an element whose attributes are all merged (see
   * `_mergeAttributes`), as the constant of each attribute followed by its value, so that the state created when a host
   * attribute writes one of them finds the value of the template: `null` for any other element.
   */
  template: readonly unknown[] | null;
};
