import { getWebComponentDeclarations } from '@xaendar/compiler';
import { createSourceFile, ScriptTarget } from 'typescript';
import { describe, expect, it } from 'vitest';
import { findStringOptions } from './component-options.utils';

/**
 * The string options read from a decorator, as their names and values.
 */
const options = (decorator: string, names: readonly string[]) => {
  const [{ decorator: node }] = getWebComponentDeclarations(createSourceFile('a.ts', `${decorator}\nclass App {}`, ScriptTarget.Latest, true));

  return findStringOptions(node, names).map(({ name, literal }) => [name, literal.text]);
};

describe('findStringOptions', () => {
  it('finds the options asked for, in the order they are declared', () => {
    expect(options('@WebComponent({ selector: \'a-b\', styleUrl: \'./s\', templateUrl: \'./t\' })', ['templateUrl', 'styleUrl'])).toEqual([['styleUrl', './s'], ['templateUrl', './t']]);
  });

  it.each([
    ['a constant', '@WebComponent({ styleUrl: STYLE })'],
    ['a template literal', '@WebComponent({ styleUrl: `./s` })'],
    ['a shorthand property', '@WebComponent({ styleUrl })'],
    ['a key that is not an identifier', '@WebComponent({ \'styleUrl\': \'./s\' })'],
    ['no options', '@WebComponent()'],
    ['options that are not an object', '@WebComponent(OPTIONS)']
  ])('leaves out %s', (_name, decorator) => {
    expect(options(decorator, ['styleUrl'])).toEqual([]);
  });
});
