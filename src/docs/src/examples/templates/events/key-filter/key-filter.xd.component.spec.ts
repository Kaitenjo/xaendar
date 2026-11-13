import { afterEach, describe, expect, it } from 'vitest';
import { KeyFilterComponent } from './key-filter.xd.component';

/**
 * Mounts the example in the document.
 */
function mount(): { element: KeyFilterComponent, field: HTMLInputElement } {
  const element = document.createElement('ex-key-filter');
  if (!(element instanceof KeyFilterComponent)) {
    throw new Error('ex-key-filter is not defined');
  }

  document.body.append(element);
  const field = element.shadowRoot!.querySelector('input')!;
  field.value = 'milk';
  return { element, field };
}

/**
 * Reads the lines of the log, the latest first.
 */
function log(element: KeyFilterComponent): string[] {
  return element.calls().map(line => line.text);
}

describe('KeyFilterComponent', () => {
  afterEach(() => document.body.replaceChildren());

  it('saves on Enter, Ctrl+S and Cmd+S, preventing the default action', () => {
    const { element, field } = mount();
    const save = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true });

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    field.dispatchEvent(save);
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'S', metaKey: true }));

    expect(log(element)).toEqual(['save("milk") on Cmd+S', 'save("milk") on Ctrl+s', 'save("milk") on Enter']);
    expect(save.defaultPrevented).toBe(true);
  });

  it('pins on Shift+Enter only, since the modifiers must match exactly', () => {
    const { element, field } = mount();

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));

    expect(log(element)).toEqual(['pin("milk")']);
  });

  it('clears the field when Escape is released, not when it is pressed', () => {
    const { element, field } = mount();

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(field.value).toBe('milk');

    field.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
    expect(field.value).toBe('');
    expect(log(element)).toEqual(['clear()']);
  });
});
