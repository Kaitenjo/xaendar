import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedListComponent } from './animated-list.xd.component';

/*
  happy-dom has no moveBefore, which the @for uses to move its rows: it moves the node as insertBefore does, without
  the state-preserving semantics of the browsers
*/
if (!('moveBefore' in Element.prototype)) {
  Object.assign(Element.prototype, {
    moveBefore(this: Element, node: Node, child: Node | null) {
      this.insertBefore(node, child);
    }
  });
}

/**
 * Waits for the effects, which run again in a microtask, and for the promises settled.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): AnimatedListComponent {
  const element = document.createElement('ex-animated-list');
  if (!(element instanceof AnimatedListComponent)) {
    throw new Error('ex-animated-list is not defined');
  }

  document.body.append(element);
  return element;
}

/**
 * The rows in the Shadow DOM, the ones leaving included.
 */
const rowsOf = (element: AnimatedListComponent) => Array.from(element.shadowRoot!.querySelectorAll('li'));

/**
 * The texts of the rows in the Shadow DOM, the ones leaving included.
 */
const textsOf = (element: AnimatedListComponent) => rowsOf(element).map(row => row.querySelector('span')?.textContent ?? row.textContent);

/**
 * Ends the CSS animation of a row, as the browser does.
 */
function endAnimation(row: Element): void {
  const event = new Event('animationend');
  Object.defineProperty(event, 'elapsedTime', { value: 0.25 });
  row.dispatchEvent(event);
}

describe('AnimatedListComponent', () => {
  beforeEach(() => {
    // happy-dom computes no animation: every element runs one of 0.25s, as the stylesheet gives the rows
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({ animationName: 'fade', animationDuration: '0.25s' } as CSSStyleDeclaration);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('applies the class of the entry to the rows rendered, and removes it at the end of their animation', async () => {
    const element = mount();
    const rows = rowsOf(element);

    expect(rows.map(row => row.className)).toEqual(['fade-in', 'fade-in', 'fade-in']);
    endAnimation(rows[0]);
    await flush();

    expect(rows.map(row => row.className)).toEqual(['', 'fade-in', 'fade-in']);
  });

  it('keeps a row removed, inert, until its animation of exit ends', async () => {
    const element = mount();
    const row = rowsOf(element)[1];

    element.complete(2);
    await flush();

    expect(textsOf(element)).toEqual(['Write the specs', 'Review the pull request', 'Update the docs']);
    expect(row.classList.contains('fade-out')).toBe(true);
    expect(row.hasAttribute('inert')).toBe(true);
    endAnimation(row);
    await flush();

    expect(textsOf(element)).toEqual(['Write the specs', 'Update the docs']);
  });

  it('places and inserts the rows ignoring the ones leaving, and gives a new row to a key coming back', async () => {
    const element = mount();
    const leaving = rowsOf(element)[2];

    element.complete(3);
    await flush();
    element.rotate();
    element.add();
    await flush();
    element.tasks.update(tasks => tasks.concat({ id: 3, label: 'Update the docs' }));
    await flush();

    // The row leaving stays where it was: the row moved after it, the one coming back at the end
    expect(textsOf(element)).toEqual(['Task 4', 'Review the pull request', 'Update the docs', 'Write the specs', 'Update the docs']);
    endAnimation(leaving);
    await flush();

    expect(textsOf(element)).toEqual(['Task 4', 'Review the pull request', 'Write the specs', 'Update the docs']);
    expect(rowsOf(element)[3]).not.toBe(leaving);
  });

  it('lets the last row leave while the content of the @empty enters', async () => {
    const element = mount();
    element.tasks.set([]);
    await flush();

    expect(textsOf(element)).toEqual(['Write the specs', 'Review the pull request', 'Update the docs', 'Nothing left to do']);
    const rows = rowsOf(element);
    for (let i = 0; i < 3; i++) {
      endAnimation(rows[i]);
    }

    await flush();

    expect(textsOf(element)).toEqual(['Nothing left to do']);
  });
});
