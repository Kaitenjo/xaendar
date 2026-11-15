import type { EventHost } from '../../types/event/event-host.type';
import type { HostAttributeBinding } from '../../types/host/host-attribute-binding.type';
import type { SourceRank } from '../../types/source-rank.type';
import type { StylingTier } from '../../types/styling/styling-tier.type';
import { removeHostAttributes } from '../../utils/host-attributes/host-attributes.util';

/**
 * The host attributes a directive or a component declares on the attributes of its element, other than `class` and
 * `style`, bound as one source of each attribute (see `AttributeOpinion`): each property is written by an effect of its
 * own, receiving the run and the index of the property (see `applyHostAttribute`), which keeps the value it computed
 * last, so that a state created later by another source finds it, and the cleanup removes only the opinions of this
 * source. It is the cleanup itself, disposed with the context of the owner.
 *
 * N.B. Deliberate, to save memory: one object per owner, which is the source, the argument of the effects and the cleanup
 * at once, and the values in one array of the exact length, in place of the closure each host attribute registered as
 * its cleanup. Do not register a closure per property again.
 */
export class HostAttributeRun implements SourceRank {
  /**
   * The values the properties computed last, in the order of `bindings`: `undefined` for one not run yet.
   */
  public readonly values: unknown[];

  /**
   * @param host - The directive or the component declaring the host attributes.
   * @param element - Its host element.
   * @param bindings - The host attributes of the attributes.
   * @param tier - The level of the owner: `1` a directive, `2` the component.
   * @param order - The order of a directive among the ones of the element.
   */
  constructor(
    public readonly host: EventHost,
    public readonly element: Element,
    public readonly bindings: readonly HostAttributeBinding[],
    public readonly tier: StylingTier,
    public readonly order: number
  ) {
    this.values = new Array<unknown>(bindings.length);
  }

  /**
   * Removes the opinions of the run, when the context of its owner is cleared.
   */
  public dispose(): void {
    removeHostAttributes(this);
  }
}
