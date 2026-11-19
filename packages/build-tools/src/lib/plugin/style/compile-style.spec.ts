import { describe, expect, it } from 'vitest';
import type { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import { compileStyle } from './compile-style';

function createHost(readFileResult: string | undefined): NodeCompilerHost {
  return {
    readFile: () => readFileResult
  } as unknown as NodeCompilerHost;
}

describe('compileStyle()', () => {
  it('compiles a .css file, stripping comments and trimming the result', async () => {
    const host = createHost('  /* header comment */\n.button { color: red; } /* trailing */  ');

    const result = await compileStyle('/src/button.css', host);

    expect(result).toEqual({
      cssText: '.button { color: red; }',
      dependencyPaths: ['/src/button.css']
    });
  });

  it('returns undefined cssText when the stylesheet file could not be read', async () => {
    const host = createHost(undefined);

    const result = await compileStyle('/src/missing.css', host);

    expect(result).toEqual({
      cssText: undefined,
      dependencyPaths: ['/src/missing.css']
    });
  });

  it('compiles a .scss file with Sass, stripping the comments it keeps', async () => {
    const host = createHost('/* header */\n$color: red;\n.button { color: $color; }');

    const result = await compileStyle('/src/button.scss', host);

    expect(result.cssText).toBe('.button {\n  color: red;\n}');
  });

  it('compiles a .sass file with the indented syntax', async () => {
    const host = createHost('$color: red\n.button\n  color: $color\n');

    const result = await compileStyle('/src/button.sass', host);

    expect(result.cssText).toBe('.button {\n  color: red;\n}');
  });

  it('compiles a .less file with Less', async () => {
    const host = createHost('@color: red;\n.button { color: @color; }');

    const result = await compileStyle('/src/button.less', host);

    expect(result).toEqual({
      cssText: '.button {\n  color: red;\n}',
      dependencyPaths: ['/src/button.less']
    });
  });

  it('throws for an unsupported stylesheet extension', async () => {
    const host = createHost('body {}');

    await expect(compileStyle('/src/button.styl', host))
      .rejects.toThrow('Unsupported stylesheet extension ".styl" for /src/button.styl.');
  });

  it('throws with a "(none)" placeholder when the entry path has no extension', async () => {
    const host = createHost('body {}');

    await expect(compileStyle('/src/button', host))
      .rejects.toThrow('Unsupported stylesheet extension "(none)" for /src/button.');
  });
});
