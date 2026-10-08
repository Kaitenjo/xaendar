import { CustomElement, Event, WebComponent } from '@xaendar/core';
import type { Output } from '@xaendar/core';

/**
 * Emits three events with different options. The detail of each event names the emission.
 */
@WebComponent({
  selector: 'ex-event-source',
  templateUrl: './event-source.xd.component.html',
  styleUrl: './event-source.css'
})
export class EventSourceComponent extends CustomElement {
  /**
   * No options: the event is dispatched on the host and goes no further.
   */
  @Event()
  public accessor plain!: Output<string>;

  /**
   * Bubbles through the ancestors of the host, within the shadow root that contains it.
   */
  @Event({ bubbles: true })
  public accessor bubbling!: Output<string>;

  /**
   * Bubbles and crosses the shadow roots, up to the document.
   */
  @Event({ bubbles: true, composed: true })
  public accessor escaping!: Output<string>;

  /**
   * Emits plain.
   */
  public emitPlain(): void {
    this.plain.emit('plain');
  }

  /**
   * Emits bubbling.
   */
  public emitBubbling(): void {
    this.bubbling.emit('bubbling');
  }

  /**
   * Emits escaping.
   */
  public emitEscaping(): void {
    this.escaping.emit('escaping');
  }

  /**
   * Emits plain with the options of escaping, for this emission only.
   */
  public emitOverride(): void {
    this.plain.emit('plain + override', { bubbles: true, composed: true });
  }
}
