import { WebComponent } from '@xaendar/core';
import { computed } from '@xaendar/core/signals';
import { StepperBase } from './stepper-base';

/**
 * A component inheriting its input.
 */
@WebComponent({
  selector: 'ex-inherited-stepper',
  templateUrl: './inherited-stepper.xd.component.html',
  styleUrl: './inherited-stepper.css'
})
export class InheritedStepperComponent extends StepperBase {
  /**
   * The type of the value the input received.
   */
  public readonly stepType = computed(() => typeof this.step());
}
