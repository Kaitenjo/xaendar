import { describe, expect, it } from 'vitest';
import type { NodeCompilerHost } from '../../models/node-compiler-host/node-compiler-host.model';
import { compileStyle } from './compile-style';

function createHost(readFileResult: string | undefined): NodeCompilerHost {
  return {
    readFile: () => readFileResult
  } as unknown as NodeCompilerHost;
}

describe('compileStyle()', () => {
  it('compiles a .css file, stripping comments and trimming the result', () => {
    const host = createHost('  /* header comment */\n.button { color: red; } /* trailing */  ');

    const result = compileStyle('/src/button.css', host);

    expect(result).toEqual({
      cssText: '.button { color: red; }',
      dependencyPaths: ['/src/button.css']
    });
  });

  it('returns undefined cssText when the stylesheet file could not be read', () => {
    const host = createHost(undefined);

    const result = compileStyle('/src/missing.css', host);

    expect(result).toEqual({
      cssText: undefined,
      dependencyPaths: ['/src/missing.css']
    });
  });

  it('throws for an unsupported stylesheet extension', () => {
    const host = createHost('body {}');

    expect(() => compileStyle('/src/button.scss', host))
      .toThrow('Unsupported stylesheet extension ".scss" for /src/button.scss.');
  });

  it('throws with a "(none)" placeholder when the entry path has no extension', () => {
    const host = createHost('body {}');

    expect(() => compileStyle('/src/button', host))
      .toThrow('Unsupported stylesheet extension "(none)" for /src/button.');
  });
});
