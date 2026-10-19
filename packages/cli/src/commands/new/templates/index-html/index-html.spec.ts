import { describe, expect, it } from 'vitest';
import { indexHtml } from './index-html';

describe('indexHtml()', () => {
  it('includes the root custom element derived from the project name', () => {
    const result = indexHtml('my-app-root', 'css');

    expect(result).toContain('<my-app-root></my-app-root>');
  });

  it('includes the name as the document title', () => {
    const result = indexHtml('my-app-root', 'css');

    expect(result).toContain('<title>my-app-root</title>');
  });

  it('links styles.css and loads main.ts as the only module', () => {
    const result = indexHtml('my-app-root', 'css');

    expect(result).toContain('<link rel="stylesheet" href="./styles.css" />');
    expect(result).toContain('<script type="module" src="./main.ts"></script>');
    expect(result).not.toContain('signals.ts');
  });

  it('links the global stylesheet with the extension of the style of the project', () => {
    const result = indexHtml('my-app-root', 'scss');

    expect(result).toContain('<link rel="stylesheet" href="./styles.scss" />');
  });
});
