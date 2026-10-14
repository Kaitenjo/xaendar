import { WebComponent } from '@xaendar/core';
import { CounterBase } from './counter-base';

/**
 * A counter that is one big button, with a link to start again.
 */
@WebComponent({
  selector: 'ex-click-counter',
  styleUrl: './counters.css',
  templateUrl: './click-counter.xd.component.html'
})
export class ClickCounterComponent extends CounterBase {}
