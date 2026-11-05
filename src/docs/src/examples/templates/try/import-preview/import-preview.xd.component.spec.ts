import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ImportPreviewComponent } from './import-preview.xd.component';

/**
 * Waits for the template, updated a microtask after a change.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): ImportPreviewComponent {
  const element = document.createElement('ex-import-preview');
  if (!(element instanceof ImportPreviewComponent)) {
    throw new Error('ex-import-preview is not defined');
  }

  document.body.append(element);
  return element;
}

/**
 * The text of each row of the example, and whether it shows the @catch.
 */
function rowsOf(element: ImportPreviewComponent): Array<[text: string, failed: boolean]> {
  return Array.from(element.shadowRoot!.querySelectorAll('li')).map(row => [row.textContent!.trim(), !!row.querySelector('.error')]);
}

describe('ImportPreviewComponent', () => {
  // happy-dom has no ElementInternals, which the buttons of the example set their role and state on
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => ({}) });
  });

  afterEach(() => document.body.replaceChildren());

  it('shows the @catch of the broken row only, the other rows rendered', () => {
    const rows = rowsOf(mount());

    expect(rows.map(([, failed]) => failed)).toEqual([false, true, false]);
    expect(rows[0][0]).toBe('Ada, 36');
    expect(rows[2][0]).toBe('Grace, 85');
  });

  it('renders the @try of each row added for the first time', async () => {
    const element = mount();

    element.addBrokenRow();
    element.addRow();
    await flush();

    expect(rowsOf(element).map(([, failed]) => failed)).toEqual([false, true, false, true, false]);
    expect(rowsOf(element)[4][0]).toBe('Alan, 41');
  });
});
