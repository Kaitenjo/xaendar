'use client';

import { useEffect, useState } from 'react';
import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import type { ReactElement } from 'react';

/*
  Next.js renders a client component on the server too, so this module is evaluated by Node during the static
  export. Only the entry point of the library is imported here, and it holds no element class: the module that
  extends HTMLElement sits behind the dynamic import that `defineQtyPicker` performs, and that call is made
  from an effect, which the server never runs.
*/

/**
 * Drives the Xaendar element from Next.js. The element is defined in an effect, which never runs on the
 * server, and its tag is rendered only once that definition landed: React 19 assigns `value` as a property only
 * when the element has one, and would write an attribute, which the input ignores, on an element not defined yet.
 * `onchanged` listens to the `changed` event of the element.
 *
 * @returns The panel to render.
 */
export function QtyPanel(): ReactElement {
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

  return (
    <div className="panel">
      {isDefined ? <ex-qty-picker value={quantity} onchanged={event => setQuantity(event.detail)} /> : null}
      <p>
        Next.js state: <strong>{quantity}</strong>
      </p>
      <button type="button" onClick={() => setQuantity(quantity + 5)}>
        +5 from Next.js
      </button>
    </div>
  );
}
