import type { TypeCheckResult } from '@xaendar/compiler';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../language-service/language-service', () => ({
  upsertVirtualFile: vi.fn()
}));

import { upsertVirtualFile } from '../../language-service/language-service';
import { createShim } from './shim.utils';
import type { ProjectLanguageService } from '../../language-service/language-service';

beforeEach(() => {
  vi.clearAllMocks();
});

const typecheckBody = (text: string): TypeCheckResult => ({ text } as unknown as TypeCheckResult);

describe('createShim()', () => {
  it('builds the shim for a single component, importing it by its class name', () => {
    const componentData = new Map([['/src/foo/foo.component.ts', ['FooComponent']]]);

    const shim = createShim(componentData, typecheckBody('function typeCheck() {}'));

    expect(shim.path).toBe('/src/foo/foo.component.ts.__typecheck__.ts');
    expect(shim.classNames).toEqual(['FooComponent']);
    expect(shim.bodyLineOffset).toBe(5);
    expect(shim.code).toBe([
      "import { FooComponent } from './foo.component';",
      "import { Signal } from '@xaendar/core/signals'",
      '',
      'declare const root: FooComponent;',
      '',
      'function typeCheck() {}'
    ].join('\n'));
  });

  it('registers the generated shim as a virtual file', () => {
    const componentData = new Map([['/src/foo/foo.component.ts', ['FooComponent']]]);

    const shim = createShim(componentData, typecheckBody('function typeCheck() {}'));

    expect(upsertVirtualFile).toHaveBeenCalledWith(shim.path, shim.code);
  });

  it('merges multiple imported components into a single intersection type', () => {
    const componentData = new Map([
      ['/src/foo/foo.component.ts', ['FooComponent']],
      ['/src/bar/bar.directive.ts', ['BarDirective', 'BarBaseDirective']]
    ]);

    const shim = createShim(componentData, typecheckBody('body'));

    expect(shim.classNames).toEqual(['FooComponent', 'BarDirective', 'BarBaseDirective']);
    expect(shim.bodyLineOffset).toBe(6);
    expect(shim.code).toBe([
      "import { FooComponent } from './foo.component';",
      "import { BarDirective, BarBaseDirective } from './bar.directive';",
      "import { Signal } from '@xaendar/core/signals'",
      '',
      'declare const root: FooComponent & BarDirective & BarBaseDirective;',
      '',
      'body'
    ].join('\n'));
  });

  it('registers the shim in the language service of the given project instead of the default one', () => {
    const project = { upsertVirtualFile: vi.fn() } as unknown as ProjectLanguageService;

    const shim = createShim(new Map([['/src/foo/foo.component.ts', ['FooComponent']]]), typecheckBody('body'), project);

    expect(project.upsertVirtualFile).toHaveBeenCalledWith(shim.path, shim.code);
    expect(upsertVirtualFile).not.toHaveBeenCalled();
  });
});
