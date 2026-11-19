import { afterEach, describe, expect, it } from 'vitest';
import { WidgetPanelComponent } from './widget-panel.xd.component';

/**
 * Waits for the effects, which run again in a microtask.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): WidgetPanelComponent {
  const element = document.createElement('ex-widget-panel');
  if (!(element instanceof WidgetPanelComponent)) {
    throw new Error('ex-widget-panel is not defined');
  }

  document.body.append(element);
  return element;
}

/**
 * The cards the panel holds.
 */
function cardsOf(element: WidgetPanelComponent): Element[] {
  return Array.from(element.shadowRoot!.querySelector('.panel')!.children);
}

describe('WidgetPanelComponent', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('creates the card of the class inside the element of the directive, with the text of the options', async () => {
    const element = mount();
    await flush();

    const cards = cardsOf(element);
    expect(cards.map(card => card.localName)).toEqual(['ex-info-card']);
    expect(cards[0].shadowRoot!.textContent).toContain('Deploy finished');
  });

  it('replaces the card when the class changes', async () => {
    const element = mount();
    await flush();
    const info = cardsOf(element)[0];

    element.showWarning();
    await flush();

    expect(cardsOf(element).map(card => card.localName)).toEqual(['ex-warning-card']);
    expect(info.isConnected).toBe(false);
  });

  it('updates the text of the card without creating it again', async () => {
    const element = mount();
    await flush();
    const card = cardsOf(element)[0];

    element.rename();
    await flush();

    expect(cardsOf(element)[0]).toBe(card);
    expect(card.shadowRoot!.textContent).toContain('Deploy #1');
  });
});
