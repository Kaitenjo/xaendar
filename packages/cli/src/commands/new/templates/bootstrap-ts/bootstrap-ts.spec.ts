import { describe, expect, it } from 'vitest';
import { bootstrapTs } from './bootstrap-ts';

describe('bootstrapTs()', () => {
  it('imports the root component from its PascalCase class name', () => {
    const result = bootstrapTs('my-app-root');

    expect(result).toContain("import { MyAppRootComponent } from './my-app-root/my-app-root.xd.component';");
  });

  it('logs the imported component class', () => {
    const result = bootstrapTs('my-app-root');

    expect(result).toContain('console.log(MyAppRootComponent);');
  });
});
