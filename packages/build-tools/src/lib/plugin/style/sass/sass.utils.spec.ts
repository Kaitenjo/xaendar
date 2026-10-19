import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NodeCompilerHost } from '../../../models/node-compiler-host/node-compiler-host.model';
import { toPosixPath } from '../../../utils/path/path.utils';
import { compileSass } from './sass.utils';

describe('compileSass()', () => {
  let dir: string;
  const host = new NodeCompilerHost();

  beforeEach(() => {
    dir = toPosixPath(mkdtempSync(join(tmpdir(), 'xaendar-sass-')));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
    vi.doUnmock('sass');
    vi.resetModules();
  });

  it('compiles a .scss file, returning the partials it uses as dependencies after the entry', async () => {
    mkdirSync(`${dir}/theme`);
    writeFileSync(`${dir}/theme/_colors.scss`, '$primary: red;');
    writeFileSync(`${dir}/button.scss`, '@use "sass:math";\n@use "theme/colors";\n.button { color: colors.$primary; width: math.div(10px, 2); }');

    const result = await compileSass(`${dir}/button.scss`, host);

    expect(result).toEqual({
      cssText: '.button {\n  color: red;\n  width: 5px;\n}',
      dependencyPaths: [`${dir}/button.scss`, `${dir}/theme/_colors.scss`]
    });
  });

  it('compiles a .sass file with the indented syntax, using a .scss partial', async () => {
    writeFileSync(`${dir}/_colors.scss`, '$primary: blue;');
    writeFileSync(`${dir}/button.sass`, '@use "colors"\n.button\n  color: colors.$primary\n');

    const result = await compileSass(`${dir}/button.sass`, host);

    expect(result).toEqual({
      cssText: '.button {\n  color: blue;\n}',
      dependencyPaths: [`${dir}/button.sass`, `${dir}/_colors.scss`]
    });
  });

  it('returns undefined cssText, watching the entry, when it cannot be read', async () => {
    const result = await compileSass(`${dir}/missing.scss`, host);

    expect(result).toEqual({ cssText: undefined, dependencyPaths: [`${dir}/missing.scss`] });
  });

  it('throws the error of Sass when the stylesheet does not compile', async () => {
    writeFileSync(`${dir}/button.scss`, '.button { color: $missing; }');

    await expect(compileSass(`${dir}/button.scss`, host)).rejects.toThrow('Undefined variable.');
  });

  it('throws an error asking to install sass when the package is missing', async () => {
    writeFileSync(`${dir}/button.scss`, '.button {}');
    vi.doMock('sass', () => {
      throw new Error('Cannot find package \'sass\'');
    });
    const { compileSass: compileWithoutSass } = await import('./sass.utils');

    await expect(compileWithoutSass(`${dir}/button.scss`, host)).rejects.toThrow('The "sass" package is required to compile');
  });
});
