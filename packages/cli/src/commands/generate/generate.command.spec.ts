import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./component/component.command', () => ({
  generateComponent: vi.fn()
}));

vi.mock('./library/library.command', () => ({
  generateLibrary: vi.fn()
}));

vi.mock('../../utils/xaendar-config/xaendar-config.utils', () => ({
  readProject: vi.fn()
}));

vi.mock('../../utils/library/library.utils', async importOriginal => ({
  ...await importOriginal<typeof import('../../utils/library/library.utils')>(),
  addLibraryExport: vi.fn()
}));

import { addLibraryExport } from '../../utils/library/library.utils';
import { readProject } from '../../utils/xaendar-config/xaendar-config.utils';
import { generateComponent } from './component/component.command';
import { generateCommand } from './generate.command';
import { generateLibrary } from './library/library.command';

/**
 * A workspace with a library in `libraries/ui`.
 */
const WORKSPACE = { dir: resolve('/ws'), configPath: resolve('/ws/xaendar.json'), config: { libs: { '@acme/ui': { root: 'libraries/ui' } } } };

/**
 * The sources of the library of the workspace.
 */
const SOURCES = resolve('/ws/libraries/ui/src');

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readProject).mockReturnValue(undefined);
});

describe('generateCommand()', () => {
  it('registers the "generate" command with its "g" alias, holding the "component" command with its "c" alias and the "library" one with its "l" alias', () => {
    const command = generateCommand();
    const component = command.commands.find(subcommand => subcommand.name() === 'component');
    const library = command.commands.find(subcommand => subcommand.name() === 'library');

    expect(command.name()).toBe('generate');
    expect(command.aliases()).toContain('g');
    expect(component?.aliases()).toContain('c');
    expect(library?.aliases()).toContain('l');
  });

  it.each([['component'], ['c']])('invokes generateComponent with the current working directory when no path option is given, through "%s"', subcommand => {
    const command = generateCommand();

    command.parse([subcommand, 'my-button'], { from: 'user' });

    expect(generateComponent).toHaveBeenCalledWith('my-button', process.cwd(), false);
    expect(addLibraryExport).not.toHaveBeenCalled();
  });

  it('invokes generateComponent with the provided path and force options', () => {
    const command = generateCommand();

    command.parse(['component', 'my-button', '--path', '/projects/app', '--force'], { from: 'user' });

    expect(generateComponent).toHaveBeenCalledWith('my-button', resolve('/projects/app'), true);
  });

  it('generates a component of a library beside its entry, which exports it', () => {
    vi.mocked(readProject).mockReturnValue(WORKSPACE);

    generateCommand().parse(['component', 'ui-card', '--library', '@acme/ui'], { from: 'user' });

    expect(generateComponent).toHaveBeenCalledWith('ui-card', SOURCES, false);
    expect(addLibraryExport).toHaveBeenCalledWith(resolve(SOURCES, 'public-api.ts'), resolve(SOURCES, 'ui-card', 'ui-card.xd.component.ts'));
  });

  it('generates a component of the library holding the working directory, or the path, where they say', () => {
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(resolve(SOURCES, 'cards'));
    vi.mocked(readProject).mockReturnValue(WORKSPACE);

    generateCommand().parse(['component', 'ui-card', '-l', 'ui'], { from: 'user' });
    generateCommand().parse(['component', 'ui-tile', '-p', resolve(SOURCES, 'tiles')], { from: 'user' });

    expect(generateComponent).toHaveBeenNthCalledWith(1, 'ui-card', resolve(SOURCES, 'cards'), false);
    expect(addLibraryExport).toHaveBeenNthCalledWith(1, resolve(SOURCES, 'public-api.ts'), resolve(SOURCES, 'cards', 'ui-card', 'ui-card.xd.component.ts'));
    expect(generateComponent).toHaveBeenNthCalledWith(2, 'ui-tile', resolve(SOURCES, 'tiles'), false);
    expect(addLibraryExport).toHaveBeenNthCalledWith(2, resolve(SOURCES, 'public-api.ts'), resolve(SOURCES, 'tiles', 'ui-tile', 'ui-tile.xd.component.ts'));
    cwd.mockRestore();
  });

  it('generates a component of the project, outside of the libraries of its workspace', () => {
    vi.mocked(readProject).mockReturnValue(WORKSPACE);

    generateCommand().parse(['component', 'my-button', '-p', '/ws/src'], { from: 'user' });

    expect(generateComponent).toHaveBeenCalledWith('my-button', resolve('/ws/src'), false);
    expect(addLibraryExport).not.toHaveBeenCalled();
  });

  it('exits when it names a library outside of a workspace', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });

    expect(() => generateCommand().parse(['component', 'ui-card', '--library', '@acme/ui'], { from: 'user' })).toThrow('process.exit');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('xd generate library @acme/ui'));
    expect(generateComponent).not.toHaveBeenCalled();
    error.mockRestore();
    exit.mockRestore();
  });

  it.each([['library'], ['l']])('invokes generateLibrary with the name and the options, through "%s"', async subcommand => {
    await generateCommand().parseAsync([subcommand, '@acme/ui', '-p', '/projects', '-s', 'scss', '--ssr'], { from: 'user' });

    expect(generateLibrary).toHaveBeenCalledWith('@acme/ui', { path: '/projects', style: 'scss', ssr: true });
  });
});
