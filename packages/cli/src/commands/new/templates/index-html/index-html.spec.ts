import { describe, expect, it } from 'vitest';
import { CLIENT_RENDERING, SERVER_RENDERING } from '../../rendering/rendering';
import { indexHtml } from './index-html';

describe('indexHtml()', () => {
  it('includes the root custom element derived from the project name', () => {
    const result = indexHtml('my-app-root', 'css', CLIENT_RENDERING);

    expect(result).toContain('<my-app-root></my-app-root>');
  });

  it('includes the name as the document title', () => {
    const result = indexHtml('my-app-root', 'css', CLIENT_RENDERING);

    expect(result).toContain('<title>my-app-root</title>');
  });

  it('links styles.css and loads main.ts as the only module', () => {
    const result = indexHtml('my-app-root', 'css', CLIENT_RENDERING);

    expect(result).toContain('<link rel="stylesheet" href="./styles.css" />');
    expect(result).toContain('<script type="module" src="./main.ts"></script>');
    expect(result).not.toContain('signals.ts');
  });

  it('links the global stylesheet with the extension of the style of the project', () => {
    const result = indexHtml('my-app-root', 'scss', CLIENT_RENDERING);

    expect(result).toContain('<link rel="stylesheet" href="./styles.scss" />');
  });

  it('holds the outlet of the rendering on the server in place of the root custom element of a project rendering on the server', () => {
    const result = indexHtml('my-app-root', 'css', SERVER_RENDERING);

    expect(result).toContain('<body>\n    <!--xd-ssr-->\n  </body>');
    expect(result).not.toContain('<my-app-root>');
    expect(result).toContain('<script type="module" src="./main.ts"></script>');
  });
});
