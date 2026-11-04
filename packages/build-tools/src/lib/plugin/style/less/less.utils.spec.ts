import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeCompilerHost } from '../../../models/node-compiler-host/node-compiler-host.model';
import { toPosixPath } from '../../../utils/path/path.utils';
import { compileLess } from './less.utils';

describe('compileLess()', () => {
  let dir: string;
  const host = new NodeCompilerHost();

  beforeEach(() => {
    dir = toPosixPath(mkdtempSync(join(tmpdir(), 'xaendar-less-')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.doUnmock('less');
    vi.resetModules();
  });

  it('compiles a .less file, returning the files it imports as dependencies after the entry', async () => {
    mkdirSync(`${dir}/theme`);
    writeFileSync(`${dir}/theme/colors.less`, '@primary: red;');
    writeFileSync(`${dir}/button.less`, '@import "theme/colors";\n.button { color: @primary; }');

    const result = await compileLess(`${dir}/button.less`, host);

    expect(result).toEqual({
      cssText: '.button {\n  color: red;\n}\n',
      dependencyPaths: [`${dir}/button.less`, `${dir}/theme/colors.less`]
    });
  });

  it('returns undefined cssText, watching the entry, when it cannot be read', async () => {
    const result = await compileLess(`${dir}/missing.less`, host);

    expect(result).toEqual({ cssText: undefined, dependencyPaths: [`${dir}/missing.less`] });
  });

  it('throws the error of Less when the stylesheet does not compile', async () => {
    writeFileSync(`${dir}/button.less`, '.button { color: @missing; }');

    await expect(compileLess(`${dir}/button.less`, host)).rejects.toMatchObject({ message: 'variable @missing is undefined' });
  });

  it('throws an error asking to install less when the package is missing', async () => {
    writeFileSync(`${dir}/button.less`, '.button {}');
    vi.doMock('less', () => {
      throw new Error('Cannot find package \'less\'');
    });
    const { compileLess: compileWithoutLess } = await import('./less.utils');

    await expect(compileWithoutLess(`${dir}/button.less`, host)).rejects.toThrow('The "less" package is required to compile');
  });
});
