import { CustomElement, Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { write } from './init-timing.log';

/**
 * A card greeting a name, logging what it sees at each step.
 */
@WebComponent({
  selector: 'ex-greeting-card',
  templateUrl: './greeting-card.xd.component.html',
  styleUrl: './init-timing.css'
})
export class GreetingCardComponent extends CustomElement {
  /**
   * The name to greet. Required: every template using the card must bind it.
   */
  @Property.required()
  public accessor name!: InputSignal<string>;

  /**
   * Logs the input before the render, and in an effect that follows it.
   */
  public onInit(): void {
    write(`onInit: name is ${this.name()}`);
    this.effect(() => write(`effect: name is ${this.name()}`));
  }

  /**
   * Logs the input after the render.
   */
  public afterRender(): void {
    write(`afterRender: name is ${this.name()}`);
  }
}
