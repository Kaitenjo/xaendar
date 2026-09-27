import { describe, expect, it } from 'vitest';
import { indexHtml } from './index-html';

describe('indexHtml()', () => {
  it('includes the root custom element derived from the project name', () => {
    const result = indexHtml('my-app-root');

    expect(result).toContain('<my-app-root></my-app-root>');
  });

  it('includes the name as the document title', () => {
    const result = indexHtml('my-app-root');

    expect(result).toContain('<title>my-app-root</title>');
  });

  it('links styles.css and loads signals.ts and main.ts as modules', () => {
    const result = indexHtml('my-app-root');

    expect(result).toContain('<link rel="stylesheet" href="./styles.css" />');
    expect(result).toContain('<script type="module" src="./signals.ts"></script>');
    expect(result).toContain('<script type="module" src="./main.ts"></script>');
  });
});
