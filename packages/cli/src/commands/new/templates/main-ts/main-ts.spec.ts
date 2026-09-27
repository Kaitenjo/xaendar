import { describe, expect, it } from 'vitest';
import { mainTs } from './main-ts';

describe('mainTs()', () => {
  it('imports the root component from its PascalCase class name', () => {
    const result = mainTs('my-app-root');

    expect(result).toContain("import { MyAppRootComponent } from './my-app-root/my-app-root.xd.component';");
  });

  it('logs the imported component class', () => {
    const result = mainTs('my-app-root');

    expect(result).toContain('console.log(MyAppRootComponent);');
  });
});
