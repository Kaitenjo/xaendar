import { describe, expect, it } from 'vitest';
import { CLIENT_RENDERING, SERVER_RENDERING } from '../../rendering/rendering';
import { tsconfigJson } from './tsconfig-json';

describe('tsconfigJson()', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(tsconfigJson(CLIENT_RENDERING))).not.toThrow();
    expect(() => JSON.parse(tsconfigJson(SERVER_RENDERING))).not.toThrow();
  });

  it('targets bundler module resolution and excludes spec files', () => {
    const result = JSON.parse(tsconfigJson(CLIENT_RENDERING));

    expect(result.compilerOptions.moduleResolution).toBe('bundler');
    expect(result.exclude).toContain('**/*.spec.ts');
  });

  it('includes only the files of src, without compiler options of the rendering, for a project rendering in the browser only', () => {
    const result = JSON.parse(tsconfigJson(CLIENT_RENDERING));

    expect(result.include).toEqual(['src/**/*.ts']);
    expect(result.compilerOptions.types).toBeUndefined();
  });

  it('sets no rootDir, which would reject the files included outside of src', () => {
    expect(JSON.parse(tsconfigJson(SERVER_RENDERING)).compilerOptions.rootDir).toBeUndefined();
  });

  it('adds the types of Node and the server for a project rendering on the server', () => {
    const result = JSON.parse(tsconfigJson(SERVER_RENDERING));

    expect(result.compilerOptions.types).toEqual(['node']);
    expect(result.include).toEqual(['src/**/*.ts', 'server.ts']);
  });

  it('writes each compiler option of the rendering after the ones of every project, as its JSON value', () => {
    const content = tsconfigJson({ compilerOptions: { types: ['node'], strict: false, jsx: 'preserve' } });

    expect(content).toContain([
      '    "paths": {',
      '      "@/*": ["./src/*"]',
      '    },',
      '    "types": ["node"],',
      '    "strict": false,',
      '    "jsx": "preserve"',
      '  },'
    ].join('\n'));
  });

  it('includes each file of the rendering after the ones of src, in its order', () => {
    expect(tsconfigJson({ include: ['server.ts', 'scripts/*.ts'] })).toContain('"include": ["src/**/*.ts", "server.ts", "scripts/*.ts"],');
  });
});
