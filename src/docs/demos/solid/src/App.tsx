import { createEffect, createSignal } from 'solid-js';
import type { QtyPicker } from '@xaendar-demo/qty-picker';
import type { JSX } from 'solid-js';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      /**
       * The Xaendar element, declared so TSX accepts its tag and types its ref.
       */
      'ex-qty-picker': HTMLAttributes<QtyPicker>;
    }

    interface CustomEvents {
      /**
       * The event of the Xaendar element, declared so `on:changed` is typed. It does not bubble, and `on:`
       * adds a real listener on the element itself.
       */
      changed: CustomEvent<number>;
    }
  }
}

/**
 * Drives the Xaendar element from Solid: it listens to its event with `on:`, and sends the quantity back with
 * its method, from an effect. A `prop:` would overwrite the signal of the component, so the quantity is never
 * written onto the element.
 *
 * @returns The panel to render.
 */
export function App(): JSX.Element {
  const [quantity, setQuantity] = createSignal(0);
  let picker: QtyPicker | undefined;

  createEffect(() => {
    picker?.setValue(quantity());
  });

  return (
    <div class="panel">
      <ex-qty-picker ref={picker} on:changed={event => setQuantity(event.detail)} />
      <p>
        Solid state: <strong>{quantity()}</strong>
      </p>
      <button type="button" onClick={() => setQuantity(quantity() + 5)}>
        +5 from Solid
      </button>
    </div>
  );
}
