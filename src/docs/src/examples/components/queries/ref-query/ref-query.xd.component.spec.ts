import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { MarkDirective } from './mark.directive';
import { RefQueryComponent } from './ref-query.xd.component';

/**
 * Waits for the template and for the queries, updated a microtask after it.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): RefQueryComponent {
  const element = document.createElement('ex-ref-query');
  if (!(element instanceof RefQueryComponent)) {
    throw new Error('ex-ref-query is not defined');
  }

  document.body.append(element);
  return element;
}

describe('RefQueryComponent', () => {
  // happy-dom has no ElementInternals, which the buttons of the example set their role and state on
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => ({}) });
  });

  afterEach(() => document.body.replaceChildren());

  it('finds the field by its ref, the rows of the @for by theirs, and the directives applied to the rows', () => {
    const element = mount();
    const rows = Array.from(element.shadowRoot!.querySelectorAll('li'));

    expect(element.field()).toBe(element.shadowRoot!.querySelector('input'));
    expect(element.rows()).toEqual(rows);
    expect(element.marks()).toHaveLength(2);
    expect(element.marks().every(mark => mark instanceof MarkDirective)).toBe(true);
    expect(element.marks().map(mark => mark.element)).toEqual(rows);
  });

  it('follows the rows added to the list, and marks them through their directives', async () => {
    const element = mount();

    element.add();
    await flush();
    expect(element.rows().map(row => row.textContent)).toEqual(['Signals', 'Components', 'Directives']);
    expect(element.marks()).toHaveLength(3);

    element.toggleAll();
    await flush();
    expect(element.marked()).toBe(3);
    expect(element.rows().every(row => row.classList.contains('marked'))).toBe(true);
  });
});
