import type { EventHost } from '../../types/event/event-host.type';
import type { HostAttributeBinding } from '../../types/host/host-attribute-binding.type';
import type { StylingAttribute } from '../../types/styling/styling-attribute.type';
import { removeHostStyling } from '../../utils/host-styling/host-styling.util';

/**
 * The host attributes a directive or a component declares on the `class` or on the `style` of its element, bound as one
 * source of the attribute: a single effect computes the values of all of them (see `applyHostStyling`), which the run
 * keeps, so that the next run writes only the keys that changed, a state created later finds its opinions, and the
 * cleanup removes only the keys of this source. It is the cleanup itself, disposed with the context of the owner.
 *
 * N.B. Deliberate, to save memory: one object per owner and attribute, which is the source, the argument of the effect
 * and the cleanup at once, in place of the closure each host attribute registered as its cleanup, keeping the values its
 * members gave, a single one as it is, instead of the opinions parsed from them. Do not register a closure per property
 * again, nor keep the opinions.
 */
export class HostStylingRun {
  /**
   * The values the members of the host attributes gave last, in the order of `bindings`: the value itself for a single
   * host attribute, an array of the exact length for more, `undefined` before the first run. A new array is computed at
   * every run, so that the one of the run before stays, to compare with.
   */
  public values: unknown = undefined;

  /**
   * @param host - The directive or the component declaring the host attributes.
   * @param element - Its host element.
   * @param attribute - The attribute.
   * @param bindings - The host attributes of the attribute.
   * @param rank - The rank of the owner among the sources of the attribute (see `toRank`): of the level of the
   *   directives, with the order of the directive, or of the one of the component.
   */
  constructor(
    public readonly host: EventHost,
    public readonly element: Element,
    public readonly attribute: StylingAttribute,
    public readonly bindings: readonly HostAttributeBinding[],
    public readonly rank: number
  ) { }

  /**
   * Removes what the run wrote, when the context of its owner is cleared.
   */
  public dispose(): void {
    removeHostStyling(this);
  }
}
