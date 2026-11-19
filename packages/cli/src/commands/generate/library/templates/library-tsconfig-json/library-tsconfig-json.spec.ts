import { describe, expect, it } from 'vitest';
import { libraryTsconfigJson } from './library-tsconfig-json';

describe('libraryTsconfigJson()', () => {
  it('extends the tsconfig.json of the workspace for the sources of the library', () => {
    expect(JSON.parse(libraryTsconfigJson())).toEqual({ extends: '../../tsconfig.json', include: ['src/**/*.ts'] });
  });
});
