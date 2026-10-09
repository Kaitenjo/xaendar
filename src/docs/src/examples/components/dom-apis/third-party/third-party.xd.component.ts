import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';
import { VanillaGauge } from './vanilla-gauge';

/**
 * Hosts a custom element that is not a Xaendar component: created in code, and fed by an effect.
 */
@WebComponent({
  selector: 'ex-third-party',
  templateUrl: './third-party.xd.component.html',
  styleUrl: './third-party.css'
})
export class ThirdPartyComponent extends CustomElement {
  /**
   * The element that hosts the gauge.
   */
  @Query('.host')
  public accessor host!: QuerySignal<HTMLElement | null>;
  /**
   * The level shown by the gauge.
   */
  public readonly level = signal(60);

  /**
   * Creates the gauge in its host, then keeps its property in sync with the level. The gauge is created with its
   * constructor: an import used only as a type would be dropped, and the element would never be defined.
   */
  public afterRender(): void {
    const gauge = new VanillaGauge();
    this.host()?.append(gauge);
    this.effect(() => gauge.value = this.level());
  }

  /**
   * Reads the slider.
   *
   * @param event - The input event of the slider.
   */
  public setLevel(event: Event): void {
    this.level.set(Number((event.target as HTMLInputElement).value));
  }
}
