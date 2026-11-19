import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFixtureProject } from '../testing/fixture-project/fixture-project.utils';
import type { FixtureProject } from '../types/fixture-project.type';
import { getComponentDefinition } from './component-definition';

const component = [
  'import { Property, WebComponent } from \'@xaendar/core\';',
  '@WebComponent({ selector: \'my-styled\', templateUrl: \'./styled.html\', styleUrl: \'./styled.css\' })',
  'export class Styled {',
  '  @Property(\'\') accessor label!: () => string;',
  '}',
  '@WebComponent({ selector: \'my-plain\', templateUrl: \'./plain.html\' })',
  'export class Plain {}',
  '@WebComponent({ selector: \'my-lost\', templateUrl: \'./lost.html\', styleUrl: \'./lost.css\' })',
  'export class Lost {}',
  '@WebComponent({ ...shared, selector: \'my-odd\',\'styleUrl\': \'./quoted.css\', templateUrl: \'./plain.html\', styleUrl: style }, 1)',
  'export class Odd {}'
].join('\n');

let project: FixtureProject;
let fileName: string;

beforeAll(() => {
  project = createFixtureProject();
  fileName = project.path('src/components.ts');
  ['src/styled.html', 'src/styled.css', 'src/plain.html', 'src/lost.html'].forEach(path => project.write(path, ''));
});

afterAll(() => {
  project.dispose();
});

/**
 * Returns the offset of the nth occurrence of a text of the component file, plus a delta.
 */
const at = (text: string, occurrence = 0, delta = 0): number => {
  let offset = -1;
  for (let i = 0; i <= occurrence; i++) {
    offset = component.indexOf(text, offset + 1);
  }

  return offset + delta;
};

/**
 * Returns the paths, relative to the project, the definitions lead to.
 */
const pathsAt = async (offset: number, text = component) => (await getComponentDefinition(fileName, text, offset)).map(({ fileName, span }) => {
  expect(span).toEqual({ start: 0, end: 0 });
  return fileName.replace(`${project.root}/`, '');
});

describe('getComponentDefinition', () => {
  it('leads the name of a @WebComponent, from its @ to its end, to the template and the style of the component', async () => {
    expect(await pathsAt(at('@WebComponent'))).toEqual(['src/styled.html', 'src/styled.css']);
    expect(await pathsAt(at('@WebComponent', 0, '@WebComponent'.length))).toEqual(['src/styled.html', 'src/styled.css']);
  });

  it('leads to the template only, when no style is declared or the files are missing', async () => {
    expect(await pathsAt(at('WebComponent', 2))).toEqual(['src/plain.html']);
    expect(await pathsAt(at('WebComponent', 3))).toEqual(['src/lost.html']);
  });

  it('leads the value of a templateUrl or styleUrl, quotes included, to its file', async () => {
    expect(await pathsAt(at('\'./styled.html\''))).toEqual(['src/styled.html']);
    expect(await pathsAt(at('./styled.css'))).toEqual(['src/styled.css']);
    expect(await pathsAt(at('./styled.css\'', 0, './styled.css\''.length))).toEqual(['src/styled.css']);
    expect(await pathsAt(at('./plain.html', 1))).toEqual(['src/plain.html']);
  });

  it('finds nothing on a value whose file is missing, or not read as a templateUrl or styleUrl', async () => {
    expect(await pathsAt(at('./lost.css'))).toEqual([]);
    expect(await pathsAt(at('./quoted.css'))).toEqual([]);
    expect(await pathsAt(at('style }'))).toEqual([]);
    expect(await pathsAt(at('\'my-styled\''))).toEqual([]);
  });

  it('finds nothing outside of the name of a @WebComponent', async () => {
    expect(await pathsAt(at('({ selector', 0, 1))).toEqual([]);
    expect(await pathsAt(at('Property'))).toEqual([]);
    expect(await pathsAt(at('Styled'))).toEqual([]);
  });

  it('finds nothing in a file whose components metadata cannot be extracted', async () => {
    const clashing = '@WebComponent({ selector: \'my-a\', templateUrl: \'./plain.html\' })\nclass A {\n  @Property() accessor a!: () => string;\n  @Property(0, { alias: \'a\' }) accessor b!: () => number;\n}';
    const literalLess = '@WebComponent({ selector: \'my-a\', templateUrl: url })\nclass A {}';

    expect(await pathsAt(1, clashing)).toEqual([]);
    expect(await pathsAt(1, literalLess)).toEqual([]);
  });

  it('reports the whole part the definition was requested from as the origin', async () => {
    const [{ origin }] = await getComponentDefinition(fileName, component, at('./styled.css'));

    expect(component.slice(origin!.start, origin!.end)).toBe("'./styled.css'");
  });
});
