import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/build-project/build-project.utils', () => ({
  buildProject: vi.fn()
}));

vi.mock('../../utils/build-libraries/build-libraries.utils', () => ({
  buildLibraries: vi.fn()
}));

vi.mock('../../utils/xaendar-config/xaendar-config.utils', () => ({
  readProject: vi.fn()
}));

import { buildLibraries } from '../../utils/build-libraries/build-libraries.utils';
import { buildProject } from '../../utils/build-project/build-project.utils';
import { readProject } from '../../utils/xaendar-config/xaendar-config.utils';
import { buildCommand } from './build.command';

/**
 * A workspace with a library.
 */
const WORKSPACE = { dir: '/ws', configPath: '/ws/xaendar.json', config: { libs: { '@acme/ui': { root: 'libraries/ui' } } } };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readProject).mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildCommand()', () => {
  it('registers the "build" command with its "b" alias', () => {
    const command = buildCommand();

    expect(command.name()).toBe('build');
    expect(command.aliases()).toContain('b');
  });

  it('builds the project', async () => {
    vi.mocked(readProject).mockReturnValue({ dir: '/app', configPath: '/app/xaendar.json', config: {} });

    await buildCommand().parseAsync([], { from: 'user' });

    expect(buildProject).toHaveBeenCalledExactlyOnceWith(undefined);
    expect(buildLibraries).not.toHaveBeenCalled();
  });

  it('asks for the report of the components with --static-report', async () => {
    await buildCommand().parseAsync(['--static-report'], { from: 'user' });

    expect(buildProject).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('builds the libraries of a workspace, or the one named', async () => {
    vi.mocked(readProject).mockReturnValue(WORKSPACE);

    await buildCommand().parseAsync([], { from: 'user' });
    await buildCommand().parseAsync(['ui'], { from: 'user' });

    expect(vi.mocked(buildLibraries).mock.calls).toEqual([[WORKSPACE, undefined], [WORKSPACE, 'ui']]);
    expect(buildProject).not.toHaveBeenCalled();
  });

  it('exits on a library named outside of a workspace', async () => {
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(buildCommand().parseAsync(['ui'], { from: 'user' })).rejects.toThrow('process.exit');
    expect(error).toHaveBeenCalledWith(`✖  No workspace holds ${process.cwd()}: xd build ui builds a library of a workspace.`);
    expect(buildProject).not.toHaveBeenCalled();
  });
});
