import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path/win32';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  writeFileSync: vi.fn()
}));

vi.mock('../../commands/generate/component/component.command', () => ({
  generateComponent: vi.fn()
}));

vi.mock('../../commands/new/prompt-style/prompt-style', () => ({
  promptStyle: vi.fn()
}));

import { generateComponent } from '../../commands/generate/component/component.command';
import { promptStyle } from '../../commands/new/prompt-style/prompt-style';
import { checkAndCreateProjectDirectory, createFiles, resolveStyle } from './scaffold.utils';

const isTTY = process.stdin.isTTY;

beforeEach(() => {
  vi.clearAllMocks();
  process.stdin.isTTY = false;
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  process.stdin.isTTY = isTTY;
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

describe('resolveStyle()', () => {
  it('takes the style given, asks it on a terminal, and uses css without one', async () => {
    vi.mocked(promptStyle).mockResolvedValue('less');

    expect(await resolveStyle('scss')).toBe('scss');
    expect(await resolveStyle(undefined)).toBe('css');
    process.stdin.isTTY = true;
    expect(await resolveStyle(undefined)).toBe('less');
  });

  it('exits on a style that is not supported', async () => {
    const error = stopOnExit();

    await expect(resolveStyle('styl')).rejects.toThrow('process.exit');
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Invalid style option: styl'));
  });
});

describe('checkAndCreateProjectDirectory()', () => {
  it('creates a missing directory, and accepts an empty one', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    checkAndCreateProjectDirectory('/projects/app');
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue([]);
    checkAndCreateProjectDirectory('/projects/empty');

    expect(mkdirSync).toHaveBeenCalledExactlyOnceWith('/projects/app');
  });

  it('exits on a directory that is not empty', () => {
    const error = stopOnExit();
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['file.txt'] as unknown as ReturnType<typeof readdirSync>);

    expect(() => checkAndCreateProjectDirectory('/projects/app')).toThrow('process.exit');
    expect(error).toHaveBeenCalledWith('✖  Cannot create project: target directory is not empty: /projects/app');
  });
});

describe('createFiles()', () => {
  it('writes the files, creates the directories with their children and generates the components', () => {
    createFiles([
      { type: 'file', name: 'package.json', content: '{}' },
      { type: 'directory', name: 'src', children: [{ type: 'generateComponent', name: 'app-root' }] },
      { type: 'directory', name: 'public' }
    ], 'C:/projects/app', 'scss');

    expect(writeFileSync).toHaveBeenCalledWith(resolve('C:/projects/app', 'package.json'), '{}', 'utf8');
    expect(mkdirSync).toHaveBeenCalledWith(resolve('C:/projects/app', 'src'));
    expect(mkdirSync).toHaveBeenCalledWith(resolve('C:/projects/app', 'public'));
    expect(generateComponent).toHaveBeenCalledWith('app-root', resolve('C:/projects/app', 'src'), false, 'scss');
  });
});
