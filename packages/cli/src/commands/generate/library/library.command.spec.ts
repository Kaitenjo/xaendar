import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  execSync: vi.fn()
}));

vi.mock('../../../utils/scaffold/scaffold.utils', () => ({
  checkAndCreateProjectDirectory: vi.fn(),
  createFiles: vi.fn(),
  resolveStyle: vi.fn(async (style?: string) => style ?? 'css')
}));

vi.mock('../../../utils/xaendar-config/xaendar-config.utils', () => ({
  readProject: vi.fn()
}));

vi.mock('../../new/structure/structure', () => ({
  buildStructure: vi.fn(() => [])
}));

import { checkAndCreateProjectDirectory, createFiles } from '../../../utils/scaffold/scaffold.utils';
import { readProject } from '../../../utils/xaendar-config/xaendar-config.utils';
import { CLIENT_RENDERING, SERVER_RENDERING } from '../../new/rendering/rendering';
import { buildStructure } from '../../new/structure/structure';
import { generateLibrary } from './library.command';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readProject).mockReturnValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('generateLibrary()', () => {
  it('creates the workspace in the folder of the library, with the project testing it, then installs the dependencies', async () => {
    await generateLibrary('@acme/ui', { path: '/projects', style: 'scss' });
    const directory = resolve('/projects', 'ui');

    expect(readProject).toHaveBeenCalledWith(resolve('/projects'));
    expect(checkAndCreateProjectDirectory).toHaveBeenCalledWith(directory);
    expect(buildStructure).toHaveBeenCalledWith({ name: 'ui', style: 'scss', rendering: CLIENT_RENDERING, library: { name: '@acme/ui', folder: 'ui', ssr: false } });
    expect(createFiles).toHaveBeenCalledWith([], directory, 'scss');
    expect(execSync).toHaveBeenCalledWith('npm i', { stdio: 'inherit', cwd: directory });
  });

  it('renders the project on the server, and compiles the library for it, with --ssr, in the working directory by default', async () => {
    await generateLibrary('charts', { ssr: true });

    expect(checkAndCreateProjectDirectory).toHaveBeenCalledWith(resolve(process.cwd(), 'charts'));
    expect(buildStructure).toHaveBeenCalledWith({ name: 'charts', style: 'css', rendering: SERVER_RENDERING, library: { name: 'charts', folder: 'charts', ssr: true } });
  });

  it('exits inside a workspace, which xd add library adds libraries to', async () => {
    vi.mocked(readProject).mockReturnValue({ dir: '/ws', configPath: '/ws/xaendar.json', config: { libs: {} } });
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(generateLibrary('@acme/ui', {})).rejects.toThrow('process.exit');
    expect(error).toHaveBeenCalledWith('✖  /ws/xaendar.json declares a workspace already: add the library to it with xd add library @acme/ui.');
    expect(createFiles).not.toHaveBeenCalled();
  });
});
