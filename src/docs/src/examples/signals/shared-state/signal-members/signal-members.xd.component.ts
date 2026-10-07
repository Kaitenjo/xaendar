import { CustomElement, WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import type { Signal } from '@xaendar/core/signals';
import { level } from './level.store';

/**
 * The same shared signal, exposed in three ways. The template compiler decides whether an attribute
 * binding is reactive by looking at the declaration of the members it names, not at their values.
 */
@WebComponent({
  selector: 'ex-signal-members',
  templateUrl: './signal-members.xd.component.html',
  styleUrl: './signal-members.css'
})
export class SignalMembersComponent extends CustomElement {
  /**
   * Not recognized as a signal: no signal function call, no signal type annotation.
   */
  public readonly untyped = level;

  /**
   * Recognized: annotated with a signal type imported from '@xaendar/core/signals'.
   */
  public readonly typed: Signal<number> = level;

  /**
   * Recognized: initialized by calling computed().
   */
  public readonly wrapped = computed(() => level());

  /**
   * Raises the shared level.
   */
  public raise(): void {
    level.update(value => (value + 1) % 11);
  }
}
