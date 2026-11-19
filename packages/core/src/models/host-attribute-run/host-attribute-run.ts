import type { EventHost } from '../../types/event/event-host.type';
import type { HostAttributeBinding } from '../../types/host/host-attribute-binding.type';
import { removeHostAttributes } from '../../utils/host-attributes/host-attributes.util';

/**
 * The host attributes a directive or a component declares on the attributes of its element, other than `class` and
 * `style`, bound as one source of each attribute (see `AttributeState`): each property is written by an effect of its
 * own, receiving the run and the index of the property (see `applyHostAttribute`), which keeps the value it computed
 * last, so that a state created later by another source finds it, and the cleanup removes only the opinions of this
 * source. It is the cleanup itself, disposed with the context of the owner.
 *
 * N.B. Deliberate, to save memory: one object per owner, which is the source, the argument of the effects and the cleanup
 * at once, the value of a single property kept as it is and the values of more in one array of the exact length, in
 * place of the closure each host attribute registered as its cleanup. Do not register a closure per property again, nor
 * put a single value in an array.
 */
export class HostAttributeRun {
  /**
   * The values the properties computed last, in the order of `bindings`: the value itself for a single property, an
   * array of the exact length for more (see `runValue`), `undefined` for one not run yet.
   */
  public values: unknown;

  /**
   * @param host - The directive or the component declaring the host attributes.
   * @param element - Its host element.
   * @param bindings - The host attributes of the attributes.
   * @param rank - The rank of the owner among the sources of the attributes (see `toRank`): of the level of the
   *   directives, with the order of the directive, or of the one of the component.
   */
  constructor(
    public readonly host: EventHost,
    public readonly element: Element,
    public readonly bindings: readonly HostAttributeBinding[],
    public readonly rank: number
  ) {
    this.values = bindings.length === 1 ? undefined : new Array<unknown>(bindings.length);
  }

  /**
   * Removes the opinions of the run, when the context of its owner is cleared.
   */
  public dispose(): void {
    removeHostAttributes(this);
  }
}
