import { useState } from 'preact/hooks';
import type { VNode } from 'preact';

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      /**
       * The Xaendar element, declared so TSX accepts its tag, its input and its event.
       */
      'ex-qty-picker': HTMLAttributes<HTMLElement> & { value?: number, onchanged?: (event: CustomEvent<number>) => void };
    }
  }
}

/**
 * Drives the Xaendar element from Preact. Preact assigns a prop as a property when the element has one, so
 * `value` writes the input; a prop starting with `on` becomes a listener, so `onchanged` reads the quantity the
 * element proposes.
 *
 * @returns The panel to render.
 */
export function App(): VNode {
  const [quantity, setQuantity] = useState(0);

  return (
    <div class="panel">
      <ex-qty-picker value={quantity} onchanged={event => setQuantity(event.detail)} />
      <p>
        Preact state: <strong>{quantity}</strong>
      </p>
      <button type="button" onClick={() => setQuantity(quantity + 5)}>
        +5 from Preact
      </button>
    </div>
  );
}
