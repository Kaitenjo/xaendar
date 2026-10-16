import { _Context, _setExpressionProperty } from '@xaendar/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SwitchButtonComponent } from './switch-button.xd.component';

type Item = {
  label: string,
  value: string
};

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

/**
 * Creates new items at every call: the component changes the labels of the objects it receives.
 */
function createItems(): Item[] {
  return [{ label: 'en', value: 'en' }, { label: 'it', value: 'it' }];
}

/**
 * Mounts a switch as the template of a parent does: listens to `valueChange`, binds the items, then adds it to the document.
 */
function mount(items: Item[]) {
  const element = document.createElement('ex-switch-button') as SwitchButtonComponent;
  const onValueChange = vi.fn<(event: CustomEvent<Item>) => void>();
  element.addEventListener('valueChange', onValueChange as unknown as EventListener);
  _setExpressionProperty(new _Context({} as never), element, 'items', () => items);
  document.body.append(element);

  return { element, onValueChange };
}

/**
 * Reads the buttons rendered by the switch.
 */
function buttonsOf(element: SwitchButtonComponent): HTMLButtonElement[] {
  return Array.from(element.shadowRoot!.querySelectorAll<HTMLButtonElement>('button.lang'));
}

/**
 * Reads the label shown as active.
 */
function activeLabelOf(element: SwitchButtonComponent): string | undefined {
  return element.shadowRoot!.querySelector('.label--active')?.textContent.trim();
}

/**
 * Reads the indicator sliding under the selected button.
 */
function indicatorOf(element: SwitchButtonComponent): HTMLSpanElement {
  return element.shadowRoot!.querySelector<HTMLSpanElement>('.selected')!;
}

/**
 * Gives a button the geometry happy-dom does not compute.
 */
function placeButton(button: HTMLButtonElement, left: number, width: number): void {
  Object.defineProperty(button, 'offsetLeft', { value: left });
  Object.defineProperty(button, 'offsetWidth', { value: width });
}

describe('SwitchButtonComponent', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('is the element of the ex-switch-button tag', () => {
    expect(document.createElement('ex-switch-button')).toBeInstanceOf(SwitchButtonComponent);
  });

  it('renders a button per item, with its label in upper case', () => {
    const { element } = mount(createItems());

    expect(buttonsOf(element).map(button => button.textContent.trim())).toEqual(['EN', 'IT']);
  });

  it('selects the first item after the render and emits it', async () => {
    const { element, onValueChange } = mount(createItems());
    await flush();

    expect(element.selected()).toEqual({ label: 'EN', value: 'en' });
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange.mock.calls[0][0].detail).toEqual({ label: 'EN', value: 'en' });
    expect(activeLabelOf(element)).toBe('EN');
  });

  it('selects the item of the button clicked and emits it', async () => {
    const { element, onValueChange } = mount(createItems());

    buttonsOf(element)[1].click();
    await flush();

    expect(element.selected()).toEqual({ label: 'IT', value: 'it' });
    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(onValueChange.mock.calls[1][0].detail).toEqual({ label: 'IT', value: 'it' });
    expect(activeLabelOf(element)).toBe('IT');
  });

  it('moves the indicator under the button clicked', () => {
    const { element } = mount(createItems());
    const second = buttonsOf(element)[1];
    placeButton(second, 40, 32);

    second.click();

    expect(indicatorOf(element).style.left).toBe('40px');
    expect(indicatorOf(element).style.width).toBe('32px');
  });

  it('places the indicator under the first button after the render', () => {
    const { element } = mount(createItems());

    expect(indicatorOf(element).style.left).toBe('0px');
    expect(indicatorOf(element).style.width).toBe('0px');
  });

  it('selects nothing and emits nothing without items', () => {
    const { element, onValueChange } = mount([]);

    expect(buttonsOf(element)).toHaveLength(0);
    expect(element.selected()).toBeNull();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(indicatorOf(element).style.left).toBe('');
  });

  it('keeps the selection when it is connected again', async () => {
    const { element, onValueChange } = mount(createItems());
    buttonsOf(element)[1].click();

    element.remove();
    document.body.append(element);
    await flush();

    expect(onValueChange).toHaveBeenCalledTimes(2);
    expect(element.selected()).toEqual({ label: 'IT', value: 'it' });
    expect(activeLabelOf(element)).toBe('IT');
  });
});
