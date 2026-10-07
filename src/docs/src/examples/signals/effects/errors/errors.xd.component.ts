import { CustomElement, WebComponent } from '@xaendar/core';
import { effect, signal } from '@xaendar/core/signals';

/**
 * Errors thrown by an effect: on the first run they reach the caller and the effect is gone;
 * on a later run they are uncaught, and the effect keeps reacting.
 */
@WebComponent({
  selector: 'ex-effect-errors',
  templateUrl: './errors.xd.component.html',
  styleUrl: './errors.css'
})
export class EffectErrorsComponent extends CustomElement {
  /**
   * The dependency of the effect: odd values make it throw.
   */
  public readonly value = signal(0);

  /**
   * What happened, in order.
   */
  public readonly log = signal<Array<{ id: number; text: string }>>([]);

  /**
   * Whether the effect reacting to `value` was created.
   */
  public readonly created = signal(false);

  /**
   * Reports the errors that escape the effect: they reach the global error handler.
   */
  private readonly onUncaughtError = (event: ErrorEvent): void => {
    if (String(event.message).includes('odd value')) {
      // Marks the error as handled, so that the browser does not log it
      event.preventDefault();
      this.write(`uncaught: ${event.message}`);
    }
  };

  /**
   * Starts listening to uncaught errors.
   */
  public onInit(): void {
    window.addEventListener('error', this.onUncaughtError);
  }

  /**
   * Stops listening to uncaught errors.
   */
  public onDestroy(): void {
    window.removeEventListener('error', this.onUncaughtError);
  }

  /**
   * Creates an effect that throws on its first run: effect() itself throws, and returns no disposer.
   */
  public failOnFirstRun(): void {
    try {
      effect(() => {
        this.value();
        throw new Error('failed on the first run');
      });
    } catch (error) {
      this.write(`effect() threw: ${(error as Error).message}`);
    }
  }

  /**
   * Creates an effect that throws on odd values only.
   */
  public create(): void {
    this.effect(() => {
      const value = this.value();
      if (value % 2 === 1) {
        throw new Error(`odd value ${value}`);
      }
      this.write(`run with value ${value}`);
    });
    this.created.set(true);
  }

  /**
   * Changes the value.
   */
  public increment(): void {
    this.value.update(value => value + 1);
  }

  /**
   * Appends a line to the log.
   *
   * @param text - The line.
   */
  private write(text: string): void {
    this.log.update(log => [...log, { id: log.length, text }]);
  }
}
