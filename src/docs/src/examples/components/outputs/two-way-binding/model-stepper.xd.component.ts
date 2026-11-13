import { CustomElement, Model, WebComponent } from '@xaendar/core';
import type { ModelSignal } from '@xaendar/core/signals';

/**
 * Shows a number and changes it by one: the number is a model, so the parent binding it with [(value)] sees every change.
 */
@WebComponent({
  selector: 'ex-model-stepper',
  styleUrl: './model-stepper.css',
  templateUrl: './model-stepper.xd.component.html'
})
export class ModelStepperComponent extends CustomElement {
  /**
   * The number. The parent sets it as any input; the stepper writes it too, dispatching valueChange.
   */
  @Model(0)
  public accessor value!: ModelSignal<number>;

  /**
   * Adds a delta to the number, never going below zero. At zero, Less sets the same value, and no event is dispatched.
   *
   * @param delta - The change.
   */
  public step(delta: number): void {
    this.value.update(value => Math.max(0, value + delta));
  }
}
