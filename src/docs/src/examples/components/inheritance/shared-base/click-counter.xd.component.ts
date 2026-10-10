import { WebComponent } from '@xaendar/core';
import { CounterBase } from './counter-base';

/**
 * A counter that is one big button, with a link to start again.
 */
@WebComponent({
  selector: 'ex-click-counter',
  templateUrl: './click-counter.xd.component.html',
  styleUrl: './counters.css'
})
export class ClickCounterComponent extends CounterBase {}
