import { Component, State, h } from '@stencil/core';
import { qtyPickerReady } from '../../global/app';

declare module '@stencil/core' {
  export namespace JSX {
    interface IntrinsicElements {
      /**
       * The Xaendar element, declared so JSX accepts its tag, its input and its event.
       */
      'ex-qty-picker': { value?: number, onChanged?: (event: CustomEvent<number>) => void };
    }
  }
}

/**
 * Drives the Xaendar element from Stencil: its JSX assigns `value` as a property, since the element has one, which
 * writes the input, and turns `onChanged` into a listener of `changed`, on the element itself. The component is
 * rendered in the light DOM, so the page around it keeps styling and reading it.
 */
@Component({
  tag: 'demo-app',
  shadow: false
})
export class DemoApp {
  /**
   * The quantity the application holds, which the element shows.
   */
  @State()
  public quantity = 0;

  /**
   * Waits for `<ex-qty-picker>` before the first render, so the tag is upgraded as soon as it is created.
   *
   * @returns A promise resolved once the element is defined.
   */
  public componentWillLoad(): Promise<void> {
    return qtyPickerReady;
  }

  /**
   * Renders the panel.
   *
   * @returns The nodes of the panel.
   */
  public render() {
    return (
      <div class="panel">
        <ex-qty-picker value={this.quantity} onChanged={event => (this.quantity = event.detail)} />
        <p>
          Stencil state: <strong>{this.quantity}</strong>
        </p>
        <button type="button" onClick={() => (this.quantity += 5)}>
          +5 from Stencil
        </button>
      </div>
    );
  }
}
