import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createFixtureProject } from './fixture-project.utils';

describe('createFixtureProject', () => {
  it('writes the project in a temporary directory, analyzes the template of App and deletes the project', async () => {
    const project = createFixtureProject();

    expect(existsSync(project.path('tsconfig.json'))).toBe(true);
    expect(project.root).not.toContain('\\');

    project.write('src/nested/file.ts', 'export {};');
    expect(readFileSync(project.path('src/nested/file.ts'), 'utf-8')).toBe('export {};');

    const { analysis } = await project.analyze('<b>{ title }</b>');
    expect(analysis!.templatePath).toBe(project.path('src/app.html'));

    project.dispose();
    expect(existsSync(project.root)).toBe(false);
  }, 60_000);
});
