import { useEffect, useRef, useState } from 'preact/hooks';
import type { QtyPicker } from '@xaendar-demo/qty-picker';
import type { Ref, VNode } from 'preact';

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      /**
       * The Xaendar element, declared so TSX accepts its tag and types its ref.
       */
      'ex-qty-picker': HTMLAttributes<HTMLElement> & { ref?: Ref<QtyPicker> };
    }
  }
}

/**
 * Drives the Xaendar element from Preact: it listens to its event with a ref, and sends the quantity back with
 * its method. Preact sets a property whenever the element has one, so the quantity is never passed as a prop.
 *
 * @returns The panel to render.
 */
export function App(): VNode {
  const picker = useRef<QtyPicker>(null);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const element = picker.current;
    if (!element) {
      return;
    }

    const read = (event: Event) => setQuantity((event as CustomEvent<number>).detail);
    element.addEventListener('changed', read);
    return () => element.removeEventListener('changed', read);
  }, []);

  useEffect(() => {
    picker.current?.setValue(quantity);
  }, [quantity]);

  return (
    <div class="panel">
      <ex-qty-picker ref={picker} />
      <p>
        Preact state: <strong>{quantity}</strong>
      </p>
      <button type="button" onClick={() => setQuantity(quantity + 5)}>
        +5 from Preact
      </button>
    </div>
  );
}
