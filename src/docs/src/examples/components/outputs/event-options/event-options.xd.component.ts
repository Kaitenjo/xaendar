import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

/**
 * The names of the events emitted by the source.
 */
const EVENT_NAMES = ['plain', 'bubbling', 'escaping'];

/**
 * Listens to the events of a child at four levels, from the tag of the child up to the document.
 */
@WebComponent({
  selector: 'ex-event-options',
  templateUrl: './event-options.xd.component.html',
  styleUrl: './event-options.css'
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
  public readonly rows = computed(() => this.emissions.map(emission => ({
    emission,
    cells: this.levels.map(level => this.hits()[emission]?.includes(level) ? '✓' : '—')
  })));

  /**
   * The element around the child, in the template of this component.
   */
  @Query('.frame')
  public accessor frame!: QuerySignal<HTMLElement | null>;

  /**
   * Records an event reaching the frame.
   */
  private readonly onFrame = (event: Event): void => this.record('frame', event);

  /**
   * Records an event reaching the host of this component.
   */
  private readonly onHost = (event: Event): void => this.record('host', event);

  /**
   * Records an event reaching the document, with the target it sees.
   */
  private readonly onDocument = (event: Event): void => {
    this.record('document', event);
    const first = event.composedPath()[0] as Element;
    this.documentView.set('target <' + (event.target as Element).localName + '>, composedPath()[0] <' + first.localName + '>');
  };

  /**
   * Listens on the host and on the document, until the component is removed.
   */
  public onInit(): void {
    for (const name of EVENT_NAMES) {
      this.addEventListener(name, this.onHost);
      document.addEventListener(name, this.onDocument);
    }
  }

  /**
   * Listens on the frame, which exists only once the template is rendered.
   */
  public afterRender(): void {
    for (const name of EVENT_NAMES) {
      this.frame()?.addEventListener(name, this.onFrame);
    }
  }

  /**
   * Stops listening on the host and on the document. The frame goes away with the template.
   */
  public onDestroy(): void {
    for (const name of EVENT_NAMES) {
      this.removeEventListener(name, this.onHost);
      document.removeEventListener(name, this.onDocument);
    }
  }

  /**
   * Records an event reaching the tag of the child, through a template binding.
   *
   * @param event - The event.
   */
  public fromTag(event: CustomEvent<string>): void {
    this.record('tag', event);
  }

  /**
   * Clears the table.
   */
  public reset(): void {
    this.hits.set({});
    this.documentView.set('—');
  }

  /**
   * Marks an emission as received at a level.
   *
   * @param level - The level of the listener.
   * @param event - The event, whose detail names the emission.
   */
  private record(level: string, event: Event): void {
    const emission = String((event as CustomEvent<string>).detail);
    this.hits.update(hits => hits[emission]?.includes(level) ? hits : { ...hits, [emission]: [...hits[emission] ?? [], level] });
  }
}
