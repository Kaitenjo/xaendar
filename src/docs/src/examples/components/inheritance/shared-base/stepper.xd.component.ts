import { WebComponent } from '@xaendar/core';
import { CounterBase } from './counter-base';

/**
 * A counter with two buttons around the count.
 */
@WebComponent({
  selector: 'ex-stepper',
  templateUrl: './stepper.xd.component.html',
  styleUrl: './counters.css'
})
export class StepperComponent extends CounterBase {}
