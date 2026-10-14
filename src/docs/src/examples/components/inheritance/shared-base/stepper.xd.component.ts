import { WebComponent } from '@xaendar/core';
import { CounterBase } from './counter-base';

/**
 * A counter with two buttons around the count.
 */
@WebComponent({
  selector: 'ex-stepper',
  styleUrl: './counters.css',
  templateUrl: './stepper.xd.component.html'
})
export class StepperComponent extends CounterBase {}
