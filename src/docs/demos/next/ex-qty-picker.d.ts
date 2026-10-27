import type { HTMLAttributes, Ref } from 'react';
import type { QtyPicker } from '@xaendar-demo/qty-picker';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      /**
       * The Xaendar element, declared so TSX accepts its tag and types its ref.
       */
      'ex-qty-picker': HTMLAttributes<HTMLElement> & { ref?: Ref<QtyPicker> };
    }
  }
}
