import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/scaffold/scaffold.utils', () => ({
  createFiles: vi.fn()
}));

vi.mock('../new/structure/structure', () => ({
  readCliVersion: () => '1.2.3'
}));

import { createFiles } from '../../utils/scaffold/scaffold.utils';
import { buildLibraryStructure } from '../generate/library/library-structure/library-structure';
import { addCommand } from './add.command';

/**
 * Temporary workspace the libraries are added to.
 */
let workspace: string;

beforeEach(() => {
  vi.clearAllMocks();
  workspace = mkdtempSync(join(tmpdir(), 'xaendar-add-'));
  writeFileSync(join(workspace, 'xaendar.json'), JSON.stringify({ name: 'ws', generate: { components: { style: 'scss' } } }, null, 2));
  writeFileSync(join(workspace, 'tsconfig.json'), `${JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } }, null, 2)}\n`);
  vi.spyOn(process, 'cwd').mockReturnValue(join(workspace, 'src'));
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(workspace, { recursive: true, force: true });
});

/**
 * Makes `process.exit` throw, so that a spec sees where the process stops, and silences the errors it prints.
 *
 * @returns The spy of `console.error`.
 */
function stopOnExit() {
  vi.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit');
  });
  return vi.spyOn(console, 'error').mockImplementation(() => undefined);
}

describe('addCommand()', () => {
  it('registers the "add" command with its "a" alias, holding the "library" command with its "l" alias', () => {
    const command = addCommand();
    const library = command.commands.find(subcommand => subcommand.name() === 'library');

    expect(command.name()).toBe('add');
    expect(command.aliases()).toContain('a');
    expect(library?.aliases()).toContain('l');
  });

  it('adds the library to the workspace: its folder, its entry in the libs and its paths', () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const root = join(workspace, 'libraries', 'ui');

    addCommand().parse(['library', '@acme/ui', '--ssr'], { from: 'user' });

    expect(existsSync(root)).toBe(true);
    expect(createFiles).toHaveBeenCalledWith(buildLibraryStructure({ name: '@acme/ui', folder: 'ui', ssr: true }, '1.2.3'), root, 'scss');
    expect(JSON.parse(readFileSync(join(workspace, 'xaendar.json'), 'utf-8')).libs).toEqual({ '@acme/ui': { root: 'libraries/ui', ssr: true } });
    expect(JSON.parse(readFileSync(join(workspace, 'tsconfig.json'), 'utf-8')).compilerOptions.paths).toEqual({
      '@/*': ['./src/*'],
      '@acme/ui': ['./libraries/ui/src/public-api.ts'],
      '@acme/ui/*': ['./libraries/ui/src/*']
    });
    expect(console.log).toHaveBeenCalledWith(`✔  Library "@acme/ui" added in ${root}`);
  });

  it('exits outside of a project', () => {
    vi.mocked(process.cwd).mockReturnValue(tmpdir());
    const error = stopOnExit();

    expect(() => addCommand().parse(['library', '@acme/ui'], { from: 'user' })).toThrow('process.exit');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('No xaendar.json found'));
  });

  it('exits, writing nothing, when the workspace has the library or its folder already', () => {
    const error = stopOnExit();
    writeFileSync(join(workspace, 'xaendar.json'), JSON.stringify({ libs: { '@acme/ui': { root: 'libraries/ui' } } }));
    expect(() => addCommand().parse(['library', '@acme/ui'], { from: 'user' })).toThrow('process.exit');

    writeFileSync(join(workspace, 'xaendar.json'), '{}');
    mkdirSync(join(workspace, 'libraries', 'charts'), { recursive: true });
    expect(() => addCommand().parse(['library', 'charts'], { from: 'user' })).toThrow('process.exit');

    expect(error).toHaveBeenCalledTimes(2);
    expect(createFiles).not.toHaveBeenCalled();
  });

  it('exits, writing nothing, when tsconfig.json is not plain JSON, telling the paths to add', () => {
    const error = stopOnExit();
    writeFileSync(join(workspace, 'tsconfig.json'), '{ /* options */ }');

    expect(() => addCommand().parse(['library', '@acme/ui'], { from: 'user' })).toThrow('process.exit');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('"@acme/ui/*": ['));
    expect(existsSync(join(workspace, 'libraries'))).toBe(false);
    expect(JSON.parse(readFileSync(join(workspace, 'xaendar.json'), 'utf-8')).libs).toBeUndefined();
  });
});
