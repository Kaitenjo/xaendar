import type { EventHost } from '../../types/event/event-host.type';
import type { HostPropertyBinding } from '../../types/host/host-property-binding.type';
import type { StylingAttribute } from '../../types/styling/styling-attribute.type';
import type { StylingOpinions } from '../../types/styling/styling-opinions.type';
import type { StylingSource } from '../../types/styling/styling-source.type';
import type { StylingTier } from '../../types/styling/styling-tier.type';
import { removeHostStyling } from '../../utils/host-styling/host-styling.util';

/**
 * The host properties a directive or a component declares on the `class` or on the `style` of its element, bound as one
 * source (see `StylingSource`): a single effect computes the opinions of all of them (see `applyHostStyling`), which the
 * run keeps, so that the next run writes only the keys that changed, and the cleanup removes only the keys of this
 * source. It is the cleanup itself, disposed with the context of the owner.
 *
 * N.B. Deliberate, to save memory: one object per owner and attribute, which is the source, the arguments of the effect
 * and the cleanup at once, in place of the closure each host property registered as its cleanup. Do not register a
 * closure per property again.
 */
export class HostStylingRun implements StylingSource {
  /**
   * The opinions of the keys bound one by one, `null` before the first run.
   */
  public keys: StylingOpinions | null = null;
  /**
   * The opinions of the string, `null` before the first run.
   */
  public string: StylingOpinions | null = null;

  /**
   * @param host - The directive or the component declaring the host properties.
   * @param element - Its host element.
   * @param attribute - The attribute.
   * @param bindings - The host properties of the attribute.
   * @param tier - The level of the owner: `1` a directive, `2` the component.
   * @param order - The order of a directive among the ones of the element.
   */
  constructor(
    public readonly host: EventHost,
    public readonly element: Element,
    public readonly attribute: StylingAttribute,
    public readonly bindings: readonly HostPropertyBinding[],
    public readonly tier: StylingTier,
    public readonly order: number
  ) { }

  /**
   * The owner of the source, the run itself: a getter, so that no instance holds it.
   *
   * @returns The run.
   */
  public get owner(): object {
    return this;
  }

  /**
   * Removes what the run wrote, when the context of its owner is cleared.
   */
  public dispose(): void {
    removeHostStyling(this);
  }
}
