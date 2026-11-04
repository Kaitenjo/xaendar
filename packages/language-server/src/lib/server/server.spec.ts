import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  connection: { name: 'connection' },
  documents: { name: 'documents' },
  listen: vi.fn()
}));

vi.mock('vscode-languageserver/node', () => ({
  ProposedFeatures: { all: 'all' },
  createConnection: vi.fn(() => mocks.connection),
  TextDocuments: vi.fn(function () {
    return mocks.documents;
  })
}));

vi.mock('../server-handlers/server-handlers', () => ({
  XaendarLanguageServer: vi.fn(function () {
    return { listen: mocks.listen };
  })
}));

describe('server', () => {
  it('starts the language server on a connection with every proposed feature', async () => {
    const { createConnection, TextDocuments } = await import('vscode-languageserver/node');
    const { XaendarLanguageServer } = await import('../server-handlers/server-handlers');

    await import('./server');

    expect(createConnection).toHaveBeenCalledWith('all');
    expect(TextDocuments).toHaveBeenCalledTimes(1);
    expect(XaendarLanguageServer).toHaveBeenCalledWith(mocks.connection, mocks.documents);
    expect(mocks.listen).toHaveBeenCalledTimes(1);
  });
});
