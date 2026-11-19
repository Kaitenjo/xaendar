import { createSignal } from 'solid-js';
import type { JSX } from 'solid-js';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      /**
       * The Xaendar element, declared so TSX accepts its tag.
       */
      'ex-qty-picker': HTMLAttributes<HTMLElement>;
    }

    interface ExplicitProperties {
      /**
       * The input of the Xaendar element, declared so `prop:value` is typed.
       */
      value: number;
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
 * Drives the Xaendar element from Solid: `prop:value` assigns the quantity to its input, and `on:changed` reads
 * the quantity it proposes back.
 *
 * @returns The panel to render.
 */
export function App(): JSX.Element {
  const [quantity, setQuantity] = createSignal(0);

  return (
    <div class="panel">
      <ex-qty-picker prop:value={quantity()} on:changed={event => setQuantity(event.detail)} />
      <p>
        Solid state: <strong>{quantity()}</strong>
      </p>
      <button type="button" onClick={() => setQuantity(quantity() + 5)}>
        +5 from Solid
      </button>
    </div>
  );
}
