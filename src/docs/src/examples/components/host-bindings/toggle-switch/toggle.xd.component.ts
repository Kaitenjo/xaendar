import { CustomElement, Event, HostListener, HostProperty, Property, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

/**
 * A switch drawn by its own element: the role, the state and the focus are attributes of the host, kept in sync by
 * `@HostProperty`, and the clicks and the keys are heard on the host with `@HostListener`.
 */
@WebComponent({
  selector: 'ex-toggle',
  styleUrl: './toggle.css',
  templateUrl: './toggle.xd.component.html'
})
export class ToggleComponent extends CustomElement {
  /**
   * Whether the switch ignores clicks and keys. The input is reflected on the host as the `locked` attribute: present,
   * and empty, while it is `true`.
   */
  @HostProperty('locked')
  @Property<InputSignal<boolean>>(false)
  public accessor locked!: InputSignal<boolean>;
  /**
   * Tells the parent that the switch was turned on or off, carrying the new state.
   */
  @Event()
  public accessor checkedChange!: Output<boolean>;
  /**
   * Whether the switch is on. The host has the `on` class while it is `true`.
   */
  @HostProperty('class.on')
  public readonly on = signal(false);
  /**
   * The ARIA role of the host. It reads no signal, so it is written once per connection.
   */
  @HostProperty('role')
  public readonly hostRole = 'switch';

  /**
   * The state of the switch for assistive technologies: an `aria-*` attribute writes a boolean as `'true'` or `'false'`.
   *
   * @returns Whether the switch is on.
   */
  @HostProperty('aria-checked')
  public get checkedState(): boolean {
    return this.on();
  }

  /**
   * Whether the switch is locked, for assistive technologies.
   *
   * @returns Whether the switch is locked.
   */
  @HostProperty('aria-disabled')
  public get lockedState(): boolean {
    return this.locked();
  }

  /**
   * The place of the host in the order of the focus: out of it while the switch is locked.
   *
   * @returns `-1` while the switch is locked, otherwise `0`.
   */
  @HostProperty('tabindex')
  public get focusOrder(): number {
    return this.locked() ? -1 : 0;
  }

  /**
   * Turns the switch on or off, unless it is locked, and tells the parent. Called by the clicks on the host, the
   * projected label included.
   */
  @HostListener('click')
  public toggle(): void {
    if (!this.locked()) {
      this.on.update(on => !on);
      this.checkedChange.emit(this.on());
    }
  }

  /**
   * Turns the switch on or off with Space or Enter, as a native switch does: the key events call it only for those keys.
   *
   * @param event - The key pressed while the host has the focus.
   */
  @HostListener('keydown.space')
  @HostListener('keydown.enter')
  public onKey(event: KeyboardEvent): void {
    // Space would scroll the page
    event.preventDefault();
    this.toggle();
  }
}
