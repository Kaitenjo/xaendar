import { afterEach, describe, expect, it } from 'vitest';
import { CardDesignerComponent } from './card-designer.xd.component';

/**
 * Waits for the effects, which run again in a microtask.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): CardDesignerComponent {
  const element = document.createElement('ex-card-designer');
  if (!(element instanceof CardDesignerComponent)) {
    throw new Error('ex-card-designer is not defined');
  }

  document.body.append(element);
  return element;
}

/**
 * The style of the card.
 */
const styleOf = (element: CardDesignerComponent) => element.shadowRoot!.querySelector<HTMLElement>('.card')!.style;

describe('CardDesignerComponent', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('sets the properties of the object, with their units, and the custom property as written', () => {
    const style = styleOf(mount());

    expect([style.getPropertyValue('width'), style.getPropertyValue('border-radius'), style.getPropertyValue('--hue'), style.getPropertyValue('font-weight')]).toEqual(['80%', '8px', '260', '']);
  });

  it('writes the properties that change, and removes the ones the object no longer sets', async () => {
    const element = mount();
    element.radius.set(16);
    element.toggleBold();
    await flush();

    const style = styleOf(element);
    expect([style.getPropertyValue('border-radius'), style.getPropertyValue('font-weight')]).toEqual(['16px', '700']);
    element.toggleBold();
    await flush();

    expect(style.getPropertyValue('font-weight')).toBe('');
  });
});
