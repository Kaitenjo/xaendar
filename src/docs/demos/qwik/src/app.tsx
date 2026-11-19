import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik';
import type { JSXOutput, Signal } from '@builder.io/qwik';

declare module '@builder.io/qwik' {
  export namespace QwikJSX {
    interface IntrinsicElements {
      /**
       * The Xaendar element, declared so JSX accepts its tag, its input and its ref.
       */
      'ex-qty-picker': { value?: number, ref?: Signal<HTMLElement | undefined> };
    }
  }
}

/**
 * Drives the Xaendar element from Qwik: it assigns `value` as a property, since the element has one, which writes
 * the input, and listens to the `changed` event through a ref.
 *
 * @returns The panel to render.
 */
export const App = component$((): JSXOutput => {
  const quantity = useSignal(0);
  const picker = useSignal<HTMLElement>();

  /*
    The listener goes on the element itself, since the event does not bubble, and in a visible task, the only
    place where the ref already holds the element. `document-ready` keeps it off the intersection observer:
    the panel is the whole page, and it must listen as soon as it is there.
  */
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ cleanup }) => {
    const element = picker.value;
    if (!element) {
      return;
    }

    const read = (event: Event) => {
      quantity.value = (event as CustomEvent<number>).detail;
    };

    element.addEventListener('changed', read);
    cleanup(() => element.removeEventListener('changed', read));
  }, { strategy: 'document-ready' });

  return (
    <div class="panel">
      <ex-qty-picker ref={picker} value={quantity.value} />
      <p>
        Qwik state: <strong>{quantity.value}</strong>
      </p>
      <button type="button" onClick$={() => (quantity.value += 5)}>
        +5 from Qwik
      </button>
    </div>
  );
});
