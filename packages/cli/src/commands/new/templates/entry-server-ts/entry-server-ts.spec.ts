import { describe, expect, it } from 'vitest';
import { entryServerTs } from './entry-server-ts';

describe('entryServerTs()', () => {
  it('installs the Signal polyfill and the server DOM before loading the modules of Xaendar', () => {
    const content = entryServerTs('my-app-root');

    expect(content.indexOf('loadServerDom();')).toBeLessThan(content.indexOf('await import(\'@xaendar/ssr\')'));
    expect(content).toContain('import { loadSignals } from \'@xaendar/signals\';\nimport { loadServerDom } from \'@xaendar/ssr/dom\';\n\nloadSignals();\nloadServerDom();');
  });

  it('renders the root component', () => {
    const content = entryServerTs('my-app-root');

    expect(content).toContain('const { MyAppRootComponent } = await import(\'./my-app-root/my-app-root.xd.component\');');
    expect(content).toContain('export function render(_url: string): Promise<string> {\n  return renderToString(MyAppRootComponent);\n}');
  });
});
