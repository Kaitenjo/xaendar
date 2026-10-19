import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Two switches: turning on the airplane mode locks the Wi-Fi one, through an input reflected on its host.
 */
@WebComponent({
  selector: 'ex-toggle-switch',
  styleUrl: './toggle-switch.css',
  templateUrl: './toggle-switch.xd.component.html'
})
export class ToggleSwitchComponent extends CustomElement {
  /**
   * Whether the airplane mode is on.
   */
  public readonly airplane = signal(false);
  /**
   * Whether the Wi-Fi is on.
   */
  public readonly wifi = signal(false);

  /**
   * Follows the airplane mode switch.
   *
   * @param event - The checkedChange event: the new state is its detail.
   */
  public setAirplane(event: CustomEvent<boolean>): void {
    this.airplane.set(event.detail);
  }

  /**
   * Follows the Wi-Fi switch.
   *
   * @param event - The checkedChange event: the new state is its detail.
   */
  public setWifi(event: CustomEvent<boolean>): void {
    this.wifi.set(event.detail);
  }
}
