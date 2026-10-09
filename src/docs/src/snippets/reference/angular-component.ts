// Angular
/**
 * A counter that notifies every click.
 */
@Component({
  selector: 'app-counter',
  template: `
    <button (click)="increment()">{{ count() }}</button>
    @if (count() > 5) { <p>That is a lot</p> }
  `
})
export class CounterComponent {
  /**
   * The starting value.
   */
  start = input(0);
  /**
   * Emitted with the new count.
   */
  changed = output<number>();
  /**
   * The current count.
   */
  count = signal(0);

  /**
   * Adds one and notifies the parent.
   */
  increment(): void {
    this.count.update(n => n + 1);
    this.changed.emit(this.count());
  }
}

// Xaendar: the template lives in counter.xd.component.html, with { count() } instead of {{ count() }}
/**
 * A counter that notifies every click.
 */
@WebComponent({ selector: 'app-counter', templateUrl: './counter.xd.component.html' })
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
    this.count.update(n => n + 1);
    this.changed.emit(this.count());
  }
}
