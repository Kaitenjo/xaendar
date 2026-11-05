import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { invalidateTemplateMetadata } from '../template-analysis/template-analysis';
import { createFixtureProject } from '../testing/fixture-project/fixture-project.utils';
import type { FixtureProject } from '../types/fixture-project.type';
import { getComponentDiagnostics } from './component-diagnostics';

const TIMEOUT = 60_000;
const COMPONENT_FILE = 'src/card.xd.component.ts';
let project: FixtureProject;

beforeAll(() => {
  project = createFixtureProject();
  project.write('src/card.xd.component.html', '<p></p>');
  project.write('src/card.css', '');
});

afterAll(() => {
  project.dispose();
});

/**
 * The problems of a component file holding a decorator, as the text of the file they are reported on and their message.
 */
const diagnose = async (decorator: string) => {
  const text = `${decorator}\nexport class Card {}\n`;
  const fileName = project.path(COMPONENT_FILE);
  const diagnostics = await getComponentDiagnostics(fileName, text);

  return diagnostics.map(({ span, message }) => [text.slice(span.start, span.end), message]);
};

describe('getComponentDiagnostics', () => {
  it('reports nothing for a component whose files exist, and for a file declaring no component', async () => {
    expect(await diagnose('@WebComponent({ selector: \'x-card\', styleUrl: \'./card.css\', templateUrl: \'./card.xd.component.html\' })')).toEqual([]);
    expect(await getComponentDiagnostics(project.path(COMPONENT_FILE), '')).toEqual([]);
  }, TIMEOUT);

  it('reports a templateUrl and a styleUrl leading to a missing file on their value, with the path it looked for', async () => {
    expect(await diagnose('@WebComponent({ selector: \'x-card\', styleUrl: \'./nope.css\', templateUrl: \'./nope.html\' })')).toEqual([
      ['\'./nope.css\'', `Could not find style at ${project.path('src/nope.css')}`],
      ['\'./nope.html\'', `Could not find template at ${project.path('src/nope.html')}`]
    ]);
  }, TIMEOUT);

  it('reports the options the build cannot read on their position, a missing file still being found', async () => {
    expect(await diagnose('@WebComponent({ selector: SELECTOR, styleUrl: \'./nope.css\', templateUrl: \'./card.xd.component.html\' })')).toEqual([
      ['\'./nope.css\'', `Could not find style at ${project.path('src/nope.css')}`],
      ['SELECTOR', 'The selector option of Card must be a string literal']
    ]);
  }, TIMEOUT);

  it('reports a selector that is not a valid custom element name', async () => {
    expect(await diagnose('@WebComponent({ selector: \'card\', templateUrl: \'./card.xd.component.html\' })')).toEqual([
      ['\'card\'', 'Invalid custom element name "card" in component Card']
    ]);
  }, TIMEOUT);

  it('finds no selector declared twice in a file out of the TypeScript project, which declares no component', async () => {
    project.write('outside/tsconfig.json', JSON.stringify({ files: ['a.ts'] }));
    project.write('outside/a.ts', 'export const a = 1;\n');

    const diagnostics = await getComponentDiagnostics(project.path('outside/card.xd.component.ts'), '@WebComponent({ selector: \'x-card\', templateUrl: \'./nope.html\' })\nexport class Card {}\n');

    expect(diagnostics.map(({ message }) => message)).toEqual([`Could not find template at ${project.path('outside/nope.html')}`]);
  }, TIMEOUT);

  it.each([
    ['declaring no ssr', {}, ['The ssr option of Card is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the option']],
    ['declaring ssr', { ssr: { entry: 'src/entry-server' } }, []],
    ['missing', undefined, []]
  ])('reports the ssr option according to the xaendar.json of the project, %s', async (_name, config, messages) => {
    const directory = `ssr-${config ? Object.keys(config).length : 'none'}`;
    project.write(`${directory}/card.xd.component.html`, '<p></p>');
    if (config) {
      project.write(`${directory}/xaendar.json`, JSON.stringify(config));
    }

    const diagnostics = await getComponentDiagnostics(project.path(`${directory}/card.xd.component.ts`), '@WebComponent({ selector: \'x-card\', ssr: { hydrate: \'idle\' }, templateUrl: \'./card.xd.component.html\' })\nexport class Card {}\n');

    expect(diagnostics.map(({ message }) => message)).toEqual(messages);
  }, TIMEOUT);

  describe('of a selector declared twice', () => {
    const component = (className: string, selector: string) => `@WebComponent({ selector: '${selector}', templateUrl: './card.xd.component.html' })\nexport class ${className} {}\n`;

    /**
     * Writes a component file of the fixture project, as the server does with the changes of an open file.
     */
    const save = (relativePath: string, text: string) => {
      project.write(relativePath, text);
      invalidateTemplateMetadata(project.path(relativePath));
    };

    /**
     * The selectors reported in a component file, and the messages reporting them.
     */
    const conflictsOf = async (relativePath: string) => {
      const diagnostics = await getComponentDiagnostics(project.path(relativePath), component('Card', 'x-card'));

      return diagnostics.map(({ message }) => message);
    };

    it('finds the component of another file, leaving the other selectors alone', async () => {
      save('src/card.xd.component.ts', component('Card', 'x-card'));
      save('src/other.xd.component.ts', component('Other', 'x-card'));
      save('src/free.xd.component.ts', component('Free', 'x-free'));

      const ownerFile = project.path('src/card.xd.component.ts');
      const otherFile = project.path('src/other.xd.component.ts');
      expect(await conflictsOf('src/card.xd.component.ts')).toEqual([`Selector "x-card" of component "Card" - ${ownerFile} is already used by component "Other" - ${otherFile}. Custom element names must be unique.`]);
    }, TIMEOUT);

    it('finds nothing once the selector is free', async () => {
      save('src/other.xd.component.ts', component('Other', 'x-renamed'));

      expect(await conflictsOf('src/card.xd.component.ts')).toEqual([]);
    }, TIMEOUT);

    it('finds two components of the same file', async () => {
      save('src/both.xd.component.ts', `${component('First', 'x-both')}${component('Second', 'x-both')}`);
      const fileName = project.path('src/both.xd.component.ts');

      const diagnostics = await getComponentDiagnostics(fileName, `${component('First', 'x-both')}${component('Second', 'x-both')}`);

      expect(diagnostics.map(({ message }) => message)).toEqual([
        `Selector "x-both" of component "First" - ${fileName} is already used by component "Second" - ${fileName}. Custom element names must be unique.`,
        `Selector "x-both" of component "Second" - ${fileName} is already used by component "First" - ${fileName}. Custom element names must be unique.`
      ]);
    }, TIMEOUT);
  });
});
