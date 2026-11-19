import type { HTMLAttributes } from 'react';

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
