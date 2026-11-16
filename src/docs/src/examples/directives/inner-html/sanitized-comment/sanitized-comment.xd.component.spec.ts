import { afterEach, describe, expect, it } from 'vitest';
import { SanitizedCommentComponent } from './sanitized-comment.xd.component';

/**
 * Waits for the effects, which run again in a microtask.
 */
const flush = () => new Promise<void>(resolve => setTimeout(resolve));

/**
 * Mounts the example in the document.
 */
function mount(): SanitizedCommentComponent {
  const element = document.createElement('ex-sanitized-comment');
  if (!(element instanceof SanitizedCommentComponent)) {
    throw new Error('ex-sanitized-comment is not defined');
  }

  document.body.append(element);
  return element;
}

describe('SanitizedCommentComponent', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders the comment without what can run code, and lists what was removed', async () => {
    const element = mount();
    await flush();

    const root = element.shadowRoot!;
    const comment = root.querySelector('.comment')!;
    expect(comment.querySelector('b')?.textContent).toBe('release');
    expect(comment.querySelector('a[href="https://example.com"]')).not.toBeNull();
    expect(comment.querySelector('script')).toBeNull();
    expect(comment.querySelector('img')!.hasAttribute('onerror')).toBe(false);
    expect(root.querySelector('.removed')!.textContent!.trim()).toBe('Removed: script, img[onerror], a[href]');
  });

  it('renders again the HTML typed, forgetting what was removed from the previous one', async () => {
    const element = mount();
    await flush();
    const textarea = element.shadowRoot!.querySelector('textarea')!;
    textarea.value = '<em>fine</em>';
    textarea.dispatchEvent(new Event('input'));
    await flush();

    const root = element.shadowRoot!;
    expect(root.querySelector('.comment')!.innerHTML).toBe('<em>fine</em>');
    expect(root.querySelector('.removed')!.textContent).toBe('Nothing removed');
  });
});
