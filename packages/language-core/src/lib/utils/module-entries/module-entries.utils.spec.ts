import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFixtureProject, type FixtureProject } from '../../testing/fixture-project/fixture-project.utils';
import { listModuleEntries } from './module-entries.utils';

let project: FixtureProject;

beforeAll(() => {
  project = createFixtureProject();
});

afterAll(() => {
  project.dispose();
});

describe('listModuleEntries', () => {
  it('lists the modules and the subdirectories of a directory, leaving out what cannot be imported', () => {
    project.write('lib/button.ts', '');
    project.write('lib/button.spec.ts', '');
    project.write('lib/button.test.ts', '');
    project.write('lib/types.d.ts', '');
    project.write('lib/readme.md', '');
    project.write('lib/ui/index.ts', '');
    project.write('lib/.hidden/index.ts', '');
    project.write('lib/node_modules/pkg/index.ts', '');

    expect(listModuleEntries(project.path('lib')).sort((first, second) => first.name.localeCompare(second.name))).toEqual([
      { name: 'button', isDirectory: false },
      { name: 'ui/', isDirectory: true }
    ]);
  });

  it('lists nothing for a directory that cannot be read', () => {
    expect(listModuleEntries(project.path('missing'))).toEqual([]);
  });
});
