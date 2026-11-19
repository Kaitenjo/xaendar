import { CustomElement, HostListener, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * Listens to the events of a child at four levels, from the tag of the child up to the document.
 */
@WebComponent({
  selector: 'ex-event-options',
  styleUrl: './event-options.css',
  templateUrl: './event-options.xd.component.html'
})
export class EventOptionsComponent extends CustomElement {
  /**
   * The emissions, in the order of the buttons: each one is the detail of its event.
   */
  public readonly emissions = ['plain', 'bubbling', 'escaping', 'plain + override'];
  /**
   * Where the listeners are, from the closest to the farthest.
   */
  public readonly levels = ['tag', 'frame', 'host', 'document'];
  /**
   * For each emission, the levels that received it.
   */
  public readonly hits = signal<Record<string, string[]>>({});
  /**
   * The target and the first node of the path, as seen by the listener on the document.
   */
  public readonly documentView = signal('—');
  /**
   * The table: a row for each emission, a cell for each level.
   */
  public readonly rows = computed(() => this._computeRows());

  /**
   * Records an event reaching the frame.
   */
  public onFrame(event: Event): void {
    this._record('frame', event);
  }
  
  /**
   * Records an event reaching the host of this component.
   */
  @HostListener('plain')
  @HostListener('bubbling')
  @HostListener('escaping')
  public onHost(event: Event): void {
    this._record('host', event);
  }

  /**
   * Records an event reaching the document, with the target it sees.
   */
  @HostListener('document:plain')
  @HostListener('document:bubbling')
  @HostListener('document:escaping')
  public onDocument(event: CustomEvent<string>) {
    this._record('document', event);
    const first = event.composedPath()[0] as Element;
    this.documentView.set('target <' + (event.target as Element).localName + '>, composedPath()[0] <' + first.localName + '>');
  };

  /**
   * Records an event reaching the tag of the child, through a template binding.
   *
   * @param event - The event.
   */
  public fromTag(event: CustomEvent<string>): void {
    this._record('tag', event);
  }

  /**
   * Clears the table.
   */
  public reset(): void {
    this.hits.set({});
    this.documentView.set('—');
  }

  /**
   * Computes the value of `rows`.
   *
   * @returns The table: a row for each emission, a cell for each level.
   */
  private _computeRows(): Array<{ emission: string; cells: string[] }> {
    return this.emissions.map(emission => ({
      emission,
      cells: this.levels.map(level => this.hits()[emission]?.includes(level) ? '✓' : '—')
    }));
  }

  /**
   * Marks an emission as received at a level.
   *
   * @param level - The level of the listener.
   * @param event - The event, whose detail names the emission.
   */
  private _record(level: string, event: Event): void {
    const emission = String((event as CustomEvent<string>).detail);
    this.hits.update(hits => hits[emission]?.includes(level) ? hits : { ...hits, [emission]: [...hits[emission] ?? [], level] });
  }
}
