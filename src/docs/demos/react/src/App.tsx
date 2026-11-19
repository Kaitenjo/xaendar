import { useState } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';

declare module 'react' {
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
 * Drives the Xaendar element from React. React 19 assigns a prop of a custom element as a property when the
 * element has one, so `value` writes the input; a prop starting with `on` becomes a listener for the rest of its
 * name, so `onchanged` reads the quantity the element proposes.
 *
 * @returns The panel to render.
 */
export function App(): ReactElement {
  const [quantity, setQuantity] = useState(0);

  return (
    <div className="panel">
      <ex-qty-picker value={quantity} onchanged={event => setQuantity(event.detail)} />
      <p>
        React state: <strong>{quantity}</strong>
      </p>
      <button type="button" onClick={() => setQuantity(quantity + 5)}>
        +5 from React
      </button>
    </div>
  );
}
