import { Property, WebComponent } from '@xaendar/core';
import type { InputSignal } from '@xaendar/core/signals';
import { CounterBase } from './counter-base';

/**
 * A counter with two buttons around the count.
 */
@WebComponent({
  selector: 'ex-stepper',
  templateUrl: './stepper.xd.component.html',
  styleUrl: './counters.css'
})
export class StepperComponent extends CounterBase {
  /**
   * How much each step adds.
   */
  @Property(1)
  public accessor step!: InputSignal<number>;
}
