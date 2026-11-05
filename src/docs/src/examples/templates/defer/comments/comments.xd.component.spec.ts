import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CommentsComponent } from './comments.xd.component';

/**
 * Mounts the example in the document.
 */
function mount(): CommentsComponent {
  const element = document.createElement('ex-comments');
  if (!(element instanceof CommentsComponent)) {
    throw new Error('ex-comments is not defined');
  }

  document.body.append(element);
  return element;
}

describe('CommentsComponent', () => {
  // happy-dom has no ElementInternals, which the buttons of the example set their role and state on
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => ({}) });
  });

  afterEach(() => document.body.replaceChildren());

  it('shows the button of the @placeholder, not the comments', () => {
    const root = mount().shadowRoot!;

    expect(root.querySelector('ex-button')!.textContent).toBe('Show the comments');
    expect(root.querySelector('ex-comment-list')).toBeNull();
  });

  it('shows the @loading once the button is clicked, then the comments in place of it, once their module is loaded', async () => {
    const root = mount().shadowRoot!;

    root.querySelector<HTMLElement>('ex-button')!.click();
    expect(root.querySelector('ex-button')).toBeNull();
    expect(root.querySelector('.note')!.textContent).toBe('Loading the comments…');
    // The first import of the module goes through the transform of the test runner
    await vi.waitFor(() => expect(root.querySelector('ex-comment-list')).not.toBeNull(), { timeout: 15000 });

    expect(root.querySelector('.note')).toBeNull();
    expect(Array.from(root.querySelector('ex-comment-list')!.shadowRoot!.querySelectorAll('li'), item => item.textContent)).toEqual([
      'Clear and short.',
      'The counter example helped.',
      'More on effects, please.'
    ]);
  }, 20000);
});
