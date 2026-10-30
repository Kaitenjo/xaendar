import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn()
}));

const generateCommandMock = vi.fn();
const newCommandMock = vi.fn();
const startCommandMock = vi.fn();
const buildCommandMock = vi.fn();
const prerenderCommandMock = vi.fn();
const testCommandMock = vi.fn();
const programMock = {
  name: vi.fn().mockReturnThis(),
  description: vi.fn().mockReturnThis(),
  version: vi.fn().mockReturnThis(),
  addCommand: vi.fn().mockReturnThis(),
  parse: vi.fn().mockReturnThis()
};

vi.mock('commander', () => ({
  program: programMock
}));

vi.mock('./commands/generate/generate.command', () => ({
  generateCommand: generateCommandMock
}));

vi.mock('./commands/new/new.command', () => ({
  newCommand: newCommandMock
}));

vi.mock('./commands/build/build.command', () => ({
  buildCommand: buildCommandMock
}));

vi.mock('./commands/prerender/prerender.command', () => ({
  prerenderCommand: prerenderCommandMock
}));

vi.mock('./commands/start/start.command', () => ({
  startCommand: startCommandMock
}));

vi.mock('./commands/test/test.command', () => ({
  testCommand: testCommandMock
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ version: '1.2.3' }));
  generateCommandMock.mockReturnValue('generate-command');
  newCommandMock.mockReturnValue('new-command');
  startCommandMock.mockReturnValue('start-command');
  buildCommandMock.mockReturnValue('build-command');
  prerenderCommandMock.mockReturnValue('prerender-command');
  testCommandMock.mockReturnValue('test-command');
});

describe('CLI entry point', () => {
  it('reads the version from package.json and configures the program', async () => {
    await vi.resetModules();
    await import('./index');

    expect(programMock.name).toHaveBeenCalledWith('xd');
    expect(programMock.description).toHaveBeenCalledWith('Xaendar CLI');
    expect(programMock.version).toHaveBeenCalledWith('1.2.3');
  });

  it('registers the generate, new, start, build, prerender and test commands', async () => {
    await vi.resetModules();
    await import('./index');

    expect(programMock.addCommand).toHaveBeenCalledWith('generate-command');
    expect(programMock.addCommand).toHaveBeenCalledWith('new-command');
    expect(programMock.addCommand).toHaveBeenCalledWith('start-command');
    expect(programMock.addCommand).toHaveBeenCalledWith('build-command');
    expect(programMock.addCommand).toHaveBeenCalledWith('prerender-command');
    expect(programMock.addCommand).toHaveBeenCalledWith('test-command');
  });

  it('parses the process arguments', async () => {
    await vi.resetModules();
    await import('./index');

    expect(programMock.parse).toHaveBeenCalled();
  });
});
