import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `angular-component.ts`, shown by the page reference/coming-from-angular.
 */
export const ANGULAR_COMPONENT: SourceFile = {
  name: 'angular-component.ts',
  lang: 'ts',
  code: `// Angular
/**
 * A counter that notifies every click.
 */
@Component({
  selector: 'app-counter',
  template: \`
    <button (click)="increment()">{{ count() }}</button>
    @if (count() > 5) { <p>That is a lot</p> }
  \`
})
export class CounterComponent {
  /**
   * The starting value.
   */
  public readonly start = input(0);
  /**
   * Emitted with the new count.
   */
  public readonly changed = output<number>();
  /**
   * The current count.
   */
  protected readonly count = signal(0);

  /**
   * Adds one and notifies the parent.
   */
  protected increment(): void {
    this.count.update(value => value + 1);
    this.changed.dispatch(this.count());
  }
}

// Xaendar: the template lives in counter.xd.component.html, with { count() } instead of {{ count() }}
/**
 * A counter that notifies every click.
 */
@WebComponent({ 
  selector: 'app-counter',
  templateUrl: './counter.xd.component.html'
})
export class CounterComponent extends CustomElement {
  /**
   * The starting value.
   */
  @Property(0)
  public accessor start!: InputSignal<number>;
  /**
   * Emitted with the new count.
   */
  @Event()
  public accessor changed!: Output<number>;
  /**
   * The current count.
   */
  public readonly count = signal(0);

  /**
   * Adds one and notifies the parent.
   */
  public increment(): void {
    this.count.update(value => value + 1);
    this.changed.dispatch(this.count());
  }
}`
};
