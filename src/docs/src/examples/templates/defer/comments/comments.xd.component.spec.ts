import { getDeferBlocks, setDeferBlockBehavior } from '@xaendar/core/testing';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { CommentsComponent } from './comments.xd.component';

/**
 * Waits for the triggers of the `@defer`, armed once the template holding it is rendered.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

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

/**
 * Reads the comments the list shows.
 */
const commentsOf = (root: ShadowRoot) => Array.from(root.querySelector('ex-comment-list')!.shadowRoot!.querySelectorAll('li'), item => item.textContent);

describe('CommentsComponent', () => {
  // happy-dom has no ElementInternals, which the buttons of the example set their role and state on
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, 'attachInternals', { configurable: true, value: () => ({}) });
  });

  afterEach(() => {
    setDeferBlockBehavior('playthrough');
    document.body.replaceChildren();
  });

  it('shows the button of the @placeholder, not the comments', () => {
    const element = mount();
    const root = element.shadowRoot!;

    expect(root.querySelector('ex-button')!.textContent).toBe('Show the comments');
    expect(root.querySelector('ex-comment-list')).toBeNull();
    expect(getDeferBlocks(element).map(({ state }) => state)).toEqual(['placeholder']);
  });

  it('shows the comments in place of the button once it is clicked and their module is loaded', async () => {
    const root = mount().shadowRoot!;
    await flush();

    root.querySelector<HTMLElement>('ex-button')!.dispatchEvent(new Event('mouseover', { bubbles: true }));
    root.querySelector<HTMLElement>('ex-button')!.click();
    // The first import of the module goes through the transform of the test runner
    await vi.waitFor(() => expect(root.querySelector('ex-comment-list')).not.toBeNull(), { timeout: 15000 });

    expect(root.querySelector('ex-button')).toBeNull();
    expect(commentsOf(root)).toEqual(['Clear and short.', 'The counter example helped.', 'More on effects, please.']);
  }, 20000);

  it('shows each part of the @defer driven by hand', async () => {
    setDeferBlockBehavior('manual');
    const element = mount();
    const root = element.shadowRoot!;
    const [comments] = getDeferBlocks(element);

    await comments.render('loading');
    expect(root.querySelector('.note')!.textContent).toBe('Loading the comments…');
    await comments.render('complete');

    expect(comments.state).toBe('complete');
    expect(root.querySelector('.note')).toBeNull();
    expect(commentsOf(root)).toHaveLength(3);
  }, 20000);
});
