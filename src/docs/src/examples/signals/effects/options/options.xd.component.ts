import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The options of an effect: hooks around every run, and a cleanup that runs when it is disposed.
 */
@WebComponent({
  selector: 'ex-effect-options',
  templateUrl: './options.xd.component.html',
  styleUrl: './options.css'
})
export class EffectOptionsComponent extends CustomElement {
  /**
   * The dependency of the effect.
   */
  public readonly count = signal(0);

  /**
   * Whether the effect is alive.
   */
  public readonly running = signal(false);

  /**
   * What happened, in order.
   */
  public readonly log = signal<Array<{ id: number; text: string }>>([]);

  /**
   * Disposes the effect.
   */
  private stop: (() => void) | undefined;

  /**
   * Creates the effect. Its first run, with its hooks, happens synchronously.
   */
  public start(): void {
    this.clear();
    this.stop = this.effect(() => this.write(`run: count = ${this.count()}`), {
      onBeforeRun: () => this.write('onBeforeRun'),
      onAfterRun: () => this.write('onAfterRun'),
      onCleanup: () => this.write('onCleanup')
    });
    this.running.set(true);
  }

  /**
   * Changes the dependency: before, run and after, but no cleanup.
   */
  public increment(): void {
    this.count.update(count => count + 1);
  }

  /**
   * Disposes the effect: the cleanup runs now.
   */
  public dispose(): void {
    this.stop?.();
    this.stop = undefined;
    this.running.set(false);
  }

  /**
   * Empties the log.
   */
  public clear(): void {
    this.log.set([]);
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
