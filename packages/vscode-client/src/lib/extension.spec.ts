import type { ExtensionContext } from 'vscode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  watcher: { name: 'watcher' },
  start: vi.fn(),
  stop: vi.fn(),
  LanguageClient: vi.fn()
}));

vi.mock('vscode', () => ({
  workspace: { createFileSystemWatcher: vi.fn(() => mocks.watcher) }
}));

vi.mock('vscode-languageclient/node', () => ({
  TransportKind: { ipc: 1 },
  LanguageClient: mocks.LanguageClient.mockImplementation(function () {
    return { start: mocks.start, stop: mocks.stop };
  })
}));

const context = { asAbsolutePath: (path: string) => `/extension/${path.replace(/\\/g, '/')}` } as unknown as ExtensionContext;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.stop.mockResolvedValue(undefined);
});

describe('extension', () => {
  it('starts the language server and the client serving the templates and the component files', async () => {
    const { activate } = await import('./extension');
    const { workspace } = await import('vscode');

    activate(context);

    const [id, name, serverOptions, clientOptions] = mocks.LanguageClient.mock.calls[0];
    expect([id, name]).toEqual(['xaendarLanguageServer', 'Xaendar Language Server']);
    expect(serverOptions).toEqual({
      run: { module: '/extension/server/server.cjs', transport: 1 },
      debug: { module: '/extension/server/server.cjs', transport: 1, options: { execArgv: ['--nolazy', '--inspect=6009'] } }
    });
    expect(clientOptions.documentSelector).toEqual([
      { language: 'html', pattern: '**/*.xd.component.html' },
      { language: 'typescript', pattern: '**/*.xd.component.ts' }
    ]);
    expect(workspace.createFileSystemWatcher).toHaveBeenCalledWith('**/*.ts');
    expect(clientOptions.synchronize.fileEvents).toEqual([mocks.watcher]);
    expect(mocks.start).toHaveBeenCalled();
  });

  it('stops the client once deactivated, doing nothing if it never started', async () => {
    const { activate, deactivate } = await import('./extension');

    expect(deactivate()).toBeUndefined();

    activate(context);
    await deactivate();
    expect(mocks.stop).toHaveBeenCalled();
  });
});
