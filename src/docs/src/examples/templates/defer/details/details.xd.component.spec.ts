import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { DetailsComponent } from './details.xd.component';

/**
 * Waits for the template, updated a microtask after a change, and for the trigger, fired in a microtask once the
 * expression of `when` is truthy.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): DetailsComponent {
  const element = document.createElement('ex-details');
  if (!(element instanceof DetailsComponent)) {
    throw new Error('ex-details is not defined');
  }

  document.body.append(element);
  return element;
}

describe('DetailsComponent', () => {
  // happy-dom has no ElementInternals, which the buttons of the example set their role and state on
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => ({}) });
  });

  afterEach(() => document.body.replaceChildren());

  it('shows the @placeholder until the details are requested, then the details', async () => {
    const element = mount();
    const root = element.shadowRoot!;
    await flush();
    expect(root.querySelector('.note')).not.toBeNull();

    element.toggle();
    await flush();

    expect(root.querySelector('.note')).toBeNull();
    expect(root.querySelector('.details')).not.toBeNull();
  });

  it('keeps the details once the request is withdrawn, as they are rendered once', async () => {
    const element = mount();
    element.toggle();
    await flush();

    element.toggle();
    await flush();

    expect(element.shadowRoot!.querySelector('p')!.textContent).toBe('requested: false');
    expect(element.shadowRoot!.querySelector('.details')).not.toBeNull();
  });
});
