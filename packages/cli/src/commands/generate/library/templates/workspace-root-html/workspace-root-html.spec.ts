import { describe, expect, it } from 'vitest';
import { workspaceRootHtml } from './workspace-root-html';

describe('workspaceRootHtml()', () => {
  it('renders the example component of the library, imported by the name of its package', () => {
    expect(workspaceRootHtml('ui-root', { name: '@acme/ui', folder: 'ui', ssr: false })).toBe([
      '@import { UiExampleComponent } from \'@acme/ui\'',
      '',
      '<p>ui-root works!</p>',
      '<ui-example />',
      ''
    ].join('\n'));
  });
});
