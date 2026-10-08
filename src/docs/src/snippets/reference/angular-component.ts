// Angular
@Component({
  selector: 'app-counter',
  template: `
    <button (click)="increment()">{{ count() }}</button>
    @if (count() > 5) { <p>That is a lot</p> }
  `
})
export class CounterComponent {
  start = input(0);
  changed = output<number>();
  count = signal(0);

  increment(): void {
    this.count.update(n => n + 1);
    this.changed.emit(this.count());
  }
}

// Xaendar: the template lives in counter.xd.component.html, with { count() } instead of {{ count() }}
@WebComponent({ selector: 'app-counter', templateUrl: './counter.xd.component.html' })
export class CounterComponent extends CustomElement {
  @Property(0)
  public accessor start!: InputSignal<number>;

  @Event()
  public accessor changed!: Output<number>;

  public readonly count = signal(0);

  public increment(): void {
    this.count.update(n => n + 1);
    this.changed.emit(this.count());
  }
}
