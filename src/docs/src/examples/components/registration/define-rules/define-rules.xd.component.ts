import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Calls `customElements.define`, which `@WebComponent` calls for every component, with valid and invalid names.
 */
@WebComponent({
  selector: 'ex-define-rules',
  templateUrl: './define-rules.xd.component.html',
  styleUrl: './define-rules.css'
})
export class DefineRulesComponent extends CustomElement {
  /**
   * The calls made, with the outcome of each one.
   */
  public readonly attempts = signal<Array<{ id: number; call: string; outcome: string }>>([]);
  /**
   * How many new names were defined, to build a different one each time.
   */
  private _defined = 0;

  /**
   * Tries to define an empty custom element with the given name.
   *
   * @param name - The name to try.
   */
  public define(name: string): void {
    this._attempt(`define('${name}', class extends HTMLElement {})`, () => customElements.define(name, class extends HTMLElement {}));
  }

  /**
   * Tries a name never used before.
   */
  public defineNew(): void {
    this.define(`ex-runtime-${++this._defined}`);
  }

  /**
   * Tries to define this very class a second time, under another name.
   */
  public defineClassAgain(): void {
    this._attempt("define('ex-define-rules-copy', DefineRulesComponent)", () => customElements.define('ex-define-rules-copy', DefineRulesComponent));
  }

  /**
   * Runs a call, logging whether it succeeded or what it threw.
   *
   * @param call - The call, as shown.
   * @param run - Makes the call.
   */
  private _attempt(call: string, run: () => void): void {
    let outcome = 'Defined';
    try {
      run();
    } catch (error) {
      outcome = `${(error as Error).name}: ${(error as Error).message}`;
    }
    this.attempts.update(attempts => [{ id: attempts.length, call, outcome }, ...attempts]);
  }
}
