import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  rmSync: vi.fn(),
  writeFileSync: vi.fn()
}));

import { generateComponent } from './component.command';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateComponent()', () => {
  it('exits the process without writing anything when the name is not a valid custom element name', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => generateComponent('InvalidName', '/projects')).toThrow('process.exit called');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mkdirSync).not.toHaveBeenCalled();
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it('errors out and exits when the target directory already exists and force is not set', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => generateComponent('my-button', '/projects')).toThrow('process.exit called');

    expect(consoleErrorSpy).toHaveBeenCalledWith('✖  Directory "my-button" already exists.');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(mkdirSync).not.toHaveBeenCalled();
  });

  it('deletes the existing directory and regenerates the component when force is set', () => {
    vi.mocked(existsSync).mockReturnValue(true);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    generateComponent('my-button', '/projects', true);

    const dir = join('/projects', 'my-button');
    expect(rmSync).toHaveBeenCalledWith(dir, { recursive: true, force: true });
    expect(consoleLogSpy).toHaveBeenCalledWith('Deleting "my-button"...');
    expect(consoleLogSpy).toHaveBeenCalledWith('✔  Component Deleted.');
    expect(mkdirSync).toHaveBeenCalledWith(dir, { recursive: true });
    expect(writeFileSync).toHaveBeenCalledTimes(4);
  });

  it('generates all four component files with css as the default style', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    generateComponent('my-button', '/projects');

    const dir = join('/projects', 'my-button');
    const writtenFiles = vi.mocked(writeFileSync).mock.calls.map(([path]) => path);

    expect(writtenFiles).toEqual([
      join(dir, 'my-button.xd.component.ts'),
      join(dir, 'my-button.xd.component.html'),
      join(dir, 'my-button.xd.component.css'),
      join(dir, 'my-button.xd.component.spec.ts')
    ]);
  });

  it('uses the provided style extension for the stylesheet file', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    generateComponent('my-button', '/projects', false, 'scss');

    const dir = join('/projects', 'my-button');
    const writtenFiles = vi.mocked(writeFileSync).mock.calls.map(([path]) => path);

    expect(writtenFiles).toContain(join(dir, 'my-button.xd.component.scss'));
  });

  it('generates a TypeScript source referencing the PascalCase class name and given style url', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    generateComponent('my-button', '/projects', false, 'scss');

    const tsContent = vi.mocked(writeFileSync).mock.calls.find(([path]) => (path as string).endsWith('.xd.component.ts'))?.[1] as string;

    expect(tsContent).toContain('export class MyButtonComponent extends BaseWebComponent');
    expect(tsContent).toContain("styleUrl: './my-button.xd.component.scss'");
    expect(tsContent).toContain("selector: 'my-button'");
  });

  it('generates an HTML template referencing the component name', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    generateComponent('my-button', '/projects');

    const htmlContent = vi.mocked(writeFileSync).mock.calls.find(([path]) => (path as string).endsWith('.xd.component.html'))?.[1] as string;

    expect(htmlContent).toBe('<p>my-button works!</p>\n');
  });

  it('generates an empty stylesheet with a placeholder comment', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    generateComponent('my-button', '/projects');

    const cssContent = vi.mocked(writeFileSync).mock.calls.find(([path]) => (path as string).endsWith('.xd.component.css'))?.[1] as string;

    expect(cssContent).toBe('/* component styles */\n');
  });

  it('generates a spec skeleton importing and instantiating the PascalCase class', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    generateComponent('my-button', '/projects');

    const specContent = vi.mocked(writeFileSync).mock.calls.find(([path]) => (path as string).endsWith('.xd.component.spec.ts'))?.[1] as string;

    expect(specContent).toContain("import { MyButtonComponent } from './my-button.xd.component';");
    expect(specContent).toContain('new MyButtonComponent()');
  });

  it('logs a success message after generating the component', () => {
    vi.mocked(existsSync).mockReturnValue(false);
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    generateComponent('my-button', '/projects');

    expect(consoleLogSpy).toHaveBeenCalledWith('✔  Component "my-button" generated');
  });
});
