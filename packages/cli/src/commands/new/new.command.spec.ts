import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path/win32';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn(),
  writeFileSync: vi.fn()
}));

vi.mock('node:child_process', () => ({
  execSync: vi.fn()
}));

vi.mock('../generate/component/component.command', () => ({
  generateComponent: vi.fn()
}));

vi.mock('./structure/structure', () => ({
  buildStructure: vi.fn()
}));

import { generateComponent } from '../generate/component/component.command';
import { newCommand } from './new.command';
import { buildStructure } from './structure/structure';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(existsSync).mockReturnValue(false);
  vi.mocked(buildStructure).mockReturnValue([]);
});

describe('newCommand()', () => {
  it('registers the "new" command requiring a project name argument', () => {
    const command = newCommand();

    expect(command.name()).toBe('new');
    expect(command.registeredArguments[0]?.required).toBe(true);
  });

  it('creates the project directory under the current working directory by default', () => {
    const command = newCommand();

    command.parse(['my-app'], { from: 'user' });

    expect(mkdirSync).toHaveBeenCalledWith(resolve(process.cwd(), 'my-app'));
  });

  it('creates the project directory under a custom path when --path is given', () => {
    const command = newCommand();

    command.parse(['my-app', '--path', 'C:/projects'], { from: 'user' });

    expect(mkdirSync).toHaveBeenCalledWith(resolve('C:/projects', 'my-app'));
  });

  it('exits with an error when the target directory already exists and is not empty', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['file.txt'] as unknown as ReturnType<typeof readdirSync>);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const command = newCommand();

    expect(() => command.parse(['my-app'], { from: 'user' })).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('target directory is not empty'));
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mkdirSync).not.toHaveBeenCalled();
  });

  it('reuses an existing empty directory without recreating it', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue([] as unknown as ReturnType<typeof readdirSync>);
    const command = newCommand();

    command.parse(['my-app'], { from: 'user' });

    expect(mkdirSync).not.toHaveBeenCalled();
    expect(execSync).toHaveBeenCalled();
  });

  it('defaults the style to css and exits when an invalid style is provided', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const command = newCommand();

    expect(() => command.parse(['my-app', '--style', 'invalid'], { from: 'user' })).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith('✖  Invalid style option: invalid');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('defaults to css when no style option is present at all', () => {
    const command = newCommand();
    vi.spyOn(command, 'opts').mockReturnValue({ style: undefined });

    command.parse(['my-app'], { from: 'user' });

    expect(buildStructure).toHaveBeenCalledWith({ name: 'my-app', style: 'css' });
  });

  it('accepts a valid non-default style option', () => {
    const command = newCommand();

    command.parse(['my-app', '--style', 'scss'], { from: 'user' });

    expect(buildStructure).toHaveBeenCalledWith({ name: 'my-app', style: 'scss' });
  });

  it('writes file entries returned by buildStructure to disk', () => {
    vi.mocked(buildStructure).mockReturnValue([
      { type: 'file', name: 'package.json', content: '{}' }
    ]);
    const command = newCommand();

    command.parse(['my-app'], { from: 'user' });

    const projectDir = resolve(process.cwd(), 'my-app');
    expect(writeFileSync).toHaveBeenCalledWith(resolve(projectDir, 'package.json'), '{}', 'utf8');
  });

  it('treats entries without a type as files', () => {
    vi.mocked(buildStructure).mockReturnValue([
      { name: 'README.md', content: 'hello' } as unknown as ReturnType<typeof buildStructure>[number]
    ]);
    const command = newCommand();

    command.parse(['my-app'], { from: 'user' });

    const projectDir = resolve(process.cwd(), 'my-app');
    expect(writeFileSync).toHaveBeenCalledWith(resolve(projectDir, 'README.md'), 'hello', 'utf8');
  });

  it('creates directory entries and recurses into their children', () => {
    vi.mocked(buildStructure).mockReturnValue([
      {
        type: 'directory',
        name: 'src',
        children: [{ type: 'file', name: 'main.ts', content: 'console.log(1);' }]
      }
    ]);
    const command = newCommand();

    command.parse(['my-app'], { from: 'user' });

    const projectDir = resolve(process.cwd(), 'my-app');
    const srcDir = resolve(projectDir, 'src');
    expect(mkdirSync).toHaveBeenCalledWith(srcDir);
    expect(writeFileSync).toHaveBeenCalledWith(resolve(srcDir, 'main.ts'), 'console.log(1);', 'utf8');
  });

  it('creates directory entries with no children without recursing', () => {
    vi.mocked(buildStructure).mockReturnValue([
      { type: 'directory', name: 'empty' }
    ]);
    const command = newCommand();

    command.parse(['my-app'], { from: 'user' });

    const projectDir = resolve(process.cwd(), 'my-app');
    expect(mkdirSync).toHaveBeenCalledWith(resolve(projectDir, 'empty'));
  });

  it('delegates generateComponent entries to the component generator with the resolved style', () => {
    vi.mocked(buildStructure).mockReturnValue([
      { type: 'generateComponent', name: 'my-app-root' }
    ]);
    const command = newCommand();

    command.parse(['my-app', '--style', 'less'], { from: 'user' });

    const projectDir = resolve(process.cwd(), 'my-app');
    expect(generateComponent).toHaveBeenCalledWith('my-app-root', projectDir, false, 'less');
  });

  it('runs "npm i" inside the generated project directory', () => {
    const command = newCommand();

    command.parse(['my-app'], { from: 'user' });

    const projectDir = resolve(process.cwd(), 'my-app');
    expect(execSync).toHaveBeenCalledWith('npm i', { stdio: 'inherit', cwd: projectDir });
  });
});
