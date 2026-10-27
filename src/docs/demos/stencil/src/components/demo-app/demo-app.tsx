import { Component, State, h } from '@stencil/core';
import { qtyPickerReady } from '../../global/app';
import type { QtyPicker } from '@xaendar-demo/qty-picker';

declare module '@stencil/core' {
  export namespace JSX {
    interface IntrinsicElements {
      /**
       * The Xaendar element, declared so JSX accepts its tag. It takes no attribute and no property: Stencil
       * sets a property whenever the element has one, so the quantity only ever travels through `setValue`.
       */
      'ex-qty-picker': { ref?: (element?: HTMLElement) => void };
    }
  }
}

/**
 * Drives the Xaendar element from Stencil: it listens to its event on the element itself, and sends the
 * quantity back with its method. The component is rendered in the light DOM, so the page around it keeps
 * styling and reading it.
 */
@Component({
  tag: 'demo-app',
  shadow: false
})
export class DemoApp {
  /**
   * The quantity the application holds, its own copy of what the element shows.
   */
  @State()
  public quantity = 0;
  /**
   * The Xaendar element, captured while rendering.
   */
  private _picker?: QtyPicker;

  /**
   * Waits for `<ex-qty-picker>` before the first render, so the tag is upgraded as soon as it is created.
   *
   * @returns A promise resolved once the element is defined.
   */
  public componentWillLoad(): Promise<void> {
    return qtyPickerReady;
  }

  /**
   * Starts listening to the element once it is in the document. The event does not bubble, so the listener
   * goes on the element itself.
   */
  public componentDidLoad(): void {
    this._picker?.addEventListener('changed', (event: Event) => {
      this.quantity = (event as CustomEvent<number>).detail;
    });
  }

  /**
   * Renders the panel.
   *
   * @returns The nodes of the panel.
   */
  public render() {
    return (
      <div class="panel">
        <ex-qty-picker ref={(element?: HTMLElement) => (this._picker = element as QtyPicker)} />
        <p>
          Stencil state: <strong>{this.quantity}</strong>
        </p>
        <button type="button" onClick={() => this._add(5)}>
          +5 from Stencil
        </button>
      </div>
    );
  }

  /**
   * Adds a delta to the quantity and pushes the new one into the element.
   *
   * @param delta - The change to apply.
   */
  private _add(delta: number): void {
    this.quantity += delta;
    this._picker?.setValue(this.quantity);
  }
}
