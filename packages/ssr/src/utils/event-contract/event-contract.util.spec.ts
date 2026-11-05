// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const core = await import('@xaendar/core');
const { _writeEventContract, eventContract } = await import('./event-contract.util');

/**
 * Runs the contract on a root.
 */
const run = (root: Element, names = ['click', 'change', 'submit'], limit = 10) => {
  eventContract(root, core._EVENT_CONTRACT_KEY, names, 'data-xd-submit', limit);
  return window[core._EVENT_CONTRACT_KEY]!;
};

/**
 * Creates a root holding a shadow root, with another one nested in it, as the parser leaves a page.
 */
const createRoot = (html = '<button></button>') => {
  const root = document.body.appendChild(document.createElement('x-root'));
  const shadowRoot = root.attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = '<x-child></x-child>';
  const nested = shadowRoot.firstElementChild!.attachShadow({ mode: 'open' });
  nested.innerHTML = html;
  return { root, shadowRoot, nested };
};

afterEach(() => {
  const contract = window[core._EVENT_CONTRACT_KEY];
  for (let i = 0; contract && i < contract.stops.length; i++) {
    contract.stops[i]();
  }

  delete window[core._EVENT_CONTRACT_KEY];
  document.body.innerHTML = '';
});

describe('eventContract', () => {
  it('records a composed event once, with its target inside the shadow roots and its path, leaving it to the page', () => {
    const { root, nested } = createRoot();
    const contract = run(root);
    const button = nested.querySelector('button')!;
    const listener = vi.fn();
    button.addEventListener('click', listener);

    button.click();

    expect(contract.events).toHaveLength(1);
    expect(contract.events[0].target).toBe(button);
    expect(contract.events[0].path).toContain(root);
    expect(listener).toHaveBeenCalledOnce();
  });

  it('records in a shadow root what is not composed and never reaches the document', () => {
    const { root, nested } = createRoot('<input />');
    const contract = run(root);
    const input = nested.querySelector('input')!;

    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(contract.events.map(({ target }) => target)).toEqual([input]);
  });

  it('keeps the events in the order they happened, and only the first ones past the limit', () => {
    const { root, nested } = createRoot('<button></button><a></a>');
    const contract = run(root, ['click'], 2);
    const button = nested.querySelector('button')!;
    const link = nested.querySelector('a')!;

    button.click();
    link.click();
    button.click();

    expect(contract.events.map(({ target }) => target)).toEqual([button, link]);
  });

  it('records only the events it is given', () => {
    const { root, nested } = createRoot();
    const contract = run(root, ['keydown']);

    nested.querySelector('button')!.click();

    expect(contract.events).toEqual([]);
  });

  it('prevents the submission of a form listening to submit in a template, not the one of a plain form', () => {
    const { root, nested } = createRoot('<form data-xd-submit=""></form><form></form>');
    const contract = run(root);
    const [marked, plain] = Array.from(nested.querySelectorAll('form'));
    const submit = (form: HTMLFormElement) => {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
      return event.defaultPrevented;
    };

    expect(submit(marked)).toBe(true);
    expect(submit(plain)).toBe(false);
    expect(contract.events).toHaveLength(2);
  });

  it('prevents the submission of a form inside an element listening to submit', () => {
    const { root, nested } = createRoot('<div data-xd-submit=""><form></form></div>');
    run(root);
    const event = new Event('submit', { bubbles: true, cancelable: true });

    nested.querySelector('form')!.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it('shares the contract among the roots of a page, recording an event once', () => {
    const first = createRoot();
    const second = createRoot('<a></a>');
    run(first.root);
    const contract = run(second.root);

    first.nested.querySelector('button')!.click();
    second.nested.querySelector('a')!.click();

    expect(contract.events).toHaveLength(2);
  });

  it('removes every listener with its stops', () => {
    const { root, nested } = createRoot('<input />');
    const contract = run(root);
    for (let i = 0; i < contract.stops.length; i++) {
      contract.stops[i]();
    }

    nested.querySelector('input')!.dispatchEvent(new Event('change', { bubbles: true }));
    document.body.click();

    expect(contract.events).toEqual([]);
  });
});

describe('_writeEventContract', () => {
  it('writes a script running the contract on the element before it, for the recorded events and the ones of the page', () => {
    const script = _writeEventContract(new Set(['pointerdown', 'click']));

    expect(script.startsWith('<script>(')).toBe(true);
    expect(script.endsWith('</script>')).toBe(true);
    expect(script).toContain('document.currentScript.previousElementSibling,Symbol.for("xaendar.eventContract"),["click","dblclick","input","change","submit","keydown","keyup","focusin","focusout","pointerdown"],"data-xd-submit",256');
  });

  it('runs by itself in a page, needing nothing outside of its text', () => {
    const { root, nested } = createRoot();
    const script = /^<script>(.*)<\/script>$/s.exec(_writeEventContract(new Set()))![1].replace('document.currentScript.previousElementSibling', 'root');

    new Function('root', script)(root);
    nested.querySelector('button')!.click();

    expect(window[core._EVENT_CONTRACT_KEY]!.events).toHaveLength(1);
  });

  it('writes the nonce of the response on the script, escaped', () => {
    expect(_writeEventContract(new Set(), 'a"b').startsWith('<script nonce="a&quot;b">(')).toBe(true);
  });

  it('writes no attribute for an empty nonce', () => {
    expect(_writeEventContract(new Set(), '').startsWith('<script>(')).toBe(true);
  });

  it('cannot be closed by the name of an event', () => {
    expect(_writeEventContract(new Set(['</script>'])).match(/<\/script>/g)).toHaveLength(1);
  });
});
