'use client';

import { useEffect, useRef, useState } from 'react';
import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import type { QtyPicker } from '@xaendar-demo/qty-picker';
import type { ReactElement } from 'react';

/*
  Next.js renders a client component on the server too, so this module is evaluated by Node during the static
  export. Only the entry point of the library is imported here, and it holds no element class: the module that
  extends HTMLElement sits behind the dynamic import that `defineQtyPicker` performs, and that call is made
  from an effect, which the server never runs.
*/

/**
 * Drives the Xaendar element from Next.js. The element is defined in an effect, which never runs on the
 * server, and its tag is rendered only once that definition landed: a tag that is not defined yet would stay
 * an empty unknown element. Data goes in through the `setValue` method of the element and comes back out
 * through its `changed` event — never through a prop, since React 19 would assign a property on the element
 * and silently destroy the signal behind it.
 *
 * @returns The panel to render.
 */
export function QtyPanel(): ReactElement {
  const picker = useRef<QtyPicker>(null);
  const [isDefined, setIsDefined] = useState(false);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    let isMounted = true;
    defineQtyPicker().then(() => {
      if (isMounted) {
        setIsDefined(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const element = picker.current;
    if (!element) {
      return;
    }

    const read = (event: Event) => setQuantity((event as CustomEvent<number>).detail);
    element.addEventListener('changed', read);
    return () => element.removeEventListener('changed', read);
  }, [isDefined]);

  useEffect(() => {
    picker.current?.setValue(quantity);
  }, [isDefined, quantity]);

  return (
    <div className="panel">
      {isDefined ? <ex-qty-picker ref={picker} /> : null}
      <p>
        Next.js state: <strong>{quantity}</strong>
      </p>
      <button type="button" onClick={() => setQuantity(quantity + 5)}>
        +5 from Next.js
      </button>
    </div>
  );
}
