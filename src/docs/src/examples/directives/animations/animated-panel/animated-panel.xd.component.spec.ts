import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedPanelComponent } from './animated-panel.xd.component';

/**
 * Waits for the effects, which run again in a microtask, and for the promises settled.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * The animations started, in order, with the function finishing each one: happy-dom has no Web Animations.
 */
const animations = new Array<{ element: Element, finish: () => void }>();

/**
 * Mounts the example in the document.
 */
function mount(): AnimatedPanelComponent {
  const element = document.createElement('ex-animated-panel');
  if (!(element instanceof AnimatedPanelComponent)) {
    throw new Error('ex-animated-panel is not defined');
  }

  document.body.append(element);
  return element;
}

/**
 * The titles of the steps in the Shadow DOM, the ones leaving marked.
 */
const stepsOf = (element: AnimatedPanelComponent) => Array.from(element.shadowRoot!.querySelectorAll('section'))
  .map(section => `${section.querySelector('h3')!.textContent}${section.hasAttribute('inert') ? ' (leaving)' : ''}`);

describe('AnimatedPanelComponent', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    Object.assign(HTMLElement.prototype, {
      animate(this: Element) {
        const animation: { element: Element, finish: () => void } = { element: this, finish: () => undefined };
        const finished = new Promise<void>(resolve => animation.finish = resolve);
        animations.push(animation);
        return { finished };
      }
    });
  });

  afterEach(() => {
    document.body.replaceChildren();
    animations.length = 0;
    delete (HTMLElement.prototype as Partial<Pick<HTMLElement, 'animate'>>).animate;
    vi.unstubAllGlobals();
  });

  it('slides the first step in', () => {
    const element = mount();

    expect(stepsOf(element)).toEqual(['Account']);
    expect(animations.map(animation => animation.element.querySelector('h3')!.textContent)).toEqual(['Account']);
  });

  it('keeps the step left, inert, until its animation finishes, while the next one enters', async () => {
    const element = mount();

    element.next();
    await flush();

    expect(stepsOf(element)).toEqual(['Account (leaving)', 'Profile']);
    animations[1].finish();
    await flush();

    expect(stepsOf(element)).toEqual(['Profile']);
  });

  it('removes every copy of a step left by quick changes once its animation finishes', async () => {
    const element = mount();

    element.next();
    await flush();
    element.next();
    await flush();
    element.next();
    await flush();

    expect(stepsOf(element)).toEqual(['Account (leaving)', 'Profile (leaving)', 'Done (leaving)', 'Account']);
    for (let i = 0; i < animations.length; i++) {
      animations[i].finish();
    }

    await flush();
    expect(stepsOf(element)).toEqual(['Account']);
  });
});
