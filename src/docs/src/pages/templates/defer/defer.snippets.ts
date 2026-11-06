import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `comments.spec.ts`, shown by the API reference of core-testing and the page templates/defer.
 */
export const DEFER_TESTING: SourceFile = {
  name: 'comments.spec.ts',
  lang: 'ts',
  code: `import { getDeferBlocks, setDeferBlockBehavior } from '@xaendar/core/testing';
import { afterEach, expect, it } from 'vitest';

afterEach(() => setDeferBlockBehavior('playthrough'));

it('shows the comments once loaded', async () => {
  // Before rendering: the triggers of the blocks never fire
  setDeferBlockBehavior('manual');
  const post = document.body.appendChild(document.createElement('app-post'));
  const [comments] = getDeferBlocks(post);
  expect(comments.state).toBe('placeholder');

  await comments.render('loading');
  // Waits for the modules of the content
  await comments.render('complete');
  expect(post.shadowRoot!.querySelector('app-comments')).not.toBeNull();
});`
};
