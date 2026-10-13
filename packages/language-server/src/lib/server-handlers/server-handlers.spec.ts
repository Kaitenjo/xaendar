import { analyzeTemplate, disposeProjectLanguageServices, getTemplateCompletions, getTemplateDefinition, getTemplateDiagnostics, getTemplateSemanticTokens, invalidateTemplateMetadata, normalizeFileName, removeDocumentOverlay, removeTemplateAnalysis, setDocumentOverlay, type TemplateAnalysis, type TemplateAnalysisResult } from '@xaendar/language-core';
import { DiagnosticCategory } from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItemKind, type Connection, DiagnosticSeverity, FileChangeType, type TextDocuments } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import { XaendarLanguageServer } from './server-handlers';

const registry = vi.hoisted(() => ({ build: vi.fn(), index: vi.fn(), remove: vi.fn(), resolve: vi.fn() }));

vi.mock('../template-registry/template-registry', () => ({
  COMPONENT_FILE_SUFFIX: '.xd.component.ts',
  TemplateRegistry: vi.fn(function () {
    return registry;
  })
}));

vi.mock('@xaendar/language-core', async importOriginal => ({
  ...await importOriginal<typeof import('@xaendar/language-core')>(),
  analyzeTemplate: vi.fn(),
  getTemplateDiagnostics: vi.fn(() => []),
  getTemplateDefinition: vi.fn(() => []),
  getTemplateSemanticTokens: vi.fn(() => []),
  getTemplateCompletions: vi.fn(() => []),
  setDocumentOverlay: vi.fn(),
  removeDocumentOverlay: vi.fn(),
  removeTemplateAnalysis: vi.fn(),
  invalidateTemplateMetadata: vi.fn(),
  disposeProjectLanguageServices: vi.fn()
}));

const TEMPLATE_URI = 'file:///src/app.xd.component.html';
const COMPONENT_URI = 'file:///src/app.xd.component.ts';
const pathOf = (uri: string) => URI.parse(uri).fsPath;
const components = new Map([[pathOf(COMPONENT_URI), ['App']]]);

type Handlers = Record<string, (...args: unknown[]) => unknown>;

/**
 * Creates a fake connection and fake documents, capturing the handlers the server registers.
 */
function setup(...documents: TextDocument[]) {
  const handlers: Handlers = {};
  const capture = (name: string) => vi.fn((handler: Handlers[string]) => {
    handlers[name] = handler;
  });
  const connection = {
    onInitialize: capture('initialize'),
    onInitialized: capture('initialized'),
    onDidChangeWatchedFiles: capture('watchedFiles'),
    onDefinition: capture('definition'),
    onCompletion: capture('completion'),
    onShutdown: capture('shutdown'),
    languages: { semanticTokens: { on: capture('semanticTokens') } },
    listen: vi.fn(),
    sendDiagnostics: vi.fn()
  };
  const openDocuments = new Map(documents.map(document => [document.uri, document]));
  const textDocuments = {
    get: (uri: string) => openDocuments.get(uri),
    all: () => [...openDocuments.values()],
    onDidChangeContent: capture('change'),
    onDidClose: capture('close'),
    listen: vi.fn()
  };
  const server = new XaendarLanguageServer(connection as unknown as Connection, textDocuments as unknown as TextDocuments<TextDocument>);
  return { server, connection, textDocuments, handlers, openDocuments };
}

const template = (text = '<b>{ title }</b>', version = 1) => TextDocument.create(TEMPLATE_URI, 'html', version, text);
const analysisOf = (source: string, dependencies: string[] = []): TemplateAnalysisResult => ({
  analysis: { templatePath: pathOf(TEMPLATE_URI), source, dependencies: new Set(dependencies) } as unknown as TemplateAnalysis,
  error: undefined,
  ast: []
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  registry.resolve.mockReturnValue(components);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('XaendarLanguageServer', () => {
  it('registers its handlers and starts listening', async () => {
    const document = template();
    const { server, connection, textDocuments, handlers } = setup(document);
    server.listen();
    const spies = {
      onInitialize: vi.spyOn(server, 'onInitialize'),
      onInitialized: vi.spyOn(server, 'onInitialized').mockResolvedValue(),
      onDidChangeWatchedFiles: vi.spyOn(server, 'onDidChangeWatchedFiles').mockResolvedValue(),
      onDefinition: vi.spyOn(server, 'onDefinition').mockResolvedValue([]),
      onCompletion: vi.spyOn(server, 'onCompletion').mockResolvedValue([]),
      onSemanticTokens: vi.spyOn(server, 'onSemanticTokens').mockResolvedValue({ data: [] }),
      onShutdown: vi.spyOn(server, 'onShutdown').mockReturnValue(),
      onDidChangeContent: vi.spyOn(server, 'onDidChangeContent').mockResolvedValue(),
      onDidClose: vi.spyOn(server, 'onDidClose').mockResolvedValue()
    };

    handlers.initialize({});
    handlers.initialized();
    handlers.watchedFiles({ changes: [] });
    handlers.definition({});
    handlers.completion({});
    handlers.semanticTokens({});
    handlers.shutdown();
    handlers.change({ document });
    handlers.close({ document });

    Object.values(spies).forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    expect(spies.onDidChangeContent).toHaveBeenCalledWith(document);
    expect(spies.onDidClose).toHaveBeenCalledWith(document);
    expect(textDocuments.listen).toHaveBeenCalledWith(connection);
    expect(connection.listen).toHaveBeenCalled();
  });

  describe('onInitialize', () => {
    it('declares the capabilities of the server', () => {
      const { server } = setup();

      expect(server.onInitialize({ workspaceFolders: null } as never).capabilities).toEqual({
        textDocumentSync: 2,
        definitionProvider: true,
        completionProvider: { triggerCharacters: ['.'] },
        semanticTokensProvider: {
          legend: { tokenTypes: ['property', 'event', 'decorator', 'variable'], tokenModifiers: ['readonly'] },
          full: true
        }
      });
    });

    it.each([
      ['the workspace folders', { workspaceFolders: [{ uri: 'file:///a', name: 'a' }, { uri: 'file:///b', name: 'b' }] }, [pathOf('file:///a'), pathOf('file:///b')]],
      ['the root URI', { workspaceFolders: null, rootUri: 'file:///root' }, [pathOf('file:///root')]],
      ['nothing', { workspaceFolders: null, rootUri: null }, []]
    ])('indexes the workspace from %s once initialized, then validates the open templates', async (_name, params, roots) => {
      const { server, openDocuments } = setup(template(), TextDocument.create(COMPONENT_URI, 'typescript', 1, ''));
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf('<b>{ title }</b>'));
      server.onInitialize(params as never);

      await server.onInitialized();
      await vi.runAllTimersAsync();

      expect(registry.build).toHaveBeenCalledWith(roots);
      expect(analyzeTemplate).toHaveBeenCalledTimes(1);
      expect(analyzeTemplate).toHaveBeenCalledWith(pathOf(TEMPLATE_URI), openDocuments.get(TEMPLATE_URI)!.getText(), components);
    });
  });

  describe('validate', () => {
    it('publishes the diagnostics of the template, located in the document', async () => {
      const document = template('<b>\n{ nope }</b>', 3);
      const { server, connection } = setup(document);
      const result = analysisOf(document.getText());
      vi.mocked(analyzeTemplate).mockResolvedValue(result);
      vi.mocked(getTemplateDiagnostics).mockReturnValue([{ span: { start: 6, end: 10 }, message: 'boom', category: DiagnosticCategory.Error, code: 2339 }]);

      expect(await server.validate(TEMPLATE_URI)).toBe(result);
      expect(getTemplateDiagnostics).toHaveBeenCalledWith(result);
      expect(connection.sendDiagnostics).toHaveBeenCalledWith({
        uri: TEMPLATE_URI,
        version: 3,
        diagnostics: [{ range: { start: { line: 1, character: 2 }, end: { line: 1, character: 6 } }, message: 'boom', severity: DiagnosticSeverity.Error, code: 2339, source: 'xaendar' }]
      });
    });

    it('clears the diagnostics of a template no component uses, or no longer open', async () => {
      const { server, connection } = setup(template());
      registry.resolve.mockReturnValue(undefined);

      expect(await server.validate(TEMPLATE_URI)).toBeUndefined();
      expect(await server.validate('file:///closed.xd.component.html')).toBeUndefined();
      expect(analyzeTemplate).not.toHaveBeenCalled();
      expect(connection.sendDiagnostics).toHaveBeenCalledWith({ uri: TEMPLATE_URI, diagnostics: [] });
      expect(connection.sendDiagnostics).toHaveBeenCalledWith({ uri: 'file:///closed.xd.component.html', diagnostics: [] });
    });
  });

  describe('document changes', () => {
    it('validates a template once the user stops typing in it', async () => {
      const document = template();
      const { server } = setup(document);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(document.getText()));

      await server.onDidChangeContent(document);
      await server.onDidChangeContent(document);
      expect(analyzeTemplate).not.toHaveBeenCalled();

      await vi.runAllTimersAsync();
      expect(analyzeTemplate).toHaveBeenCalledTimes(1);
    });

    it('applies the unsaved text of a TypeScript file and validates again the templates depending on it', async () => {
      const dependent = template();
      const other = TextDocument.create('file:///src/other.xd.component.html', 'html', 1, '<i></i>');
      const unrelated = TextDocument.create('file:///src/unrelated.xd.component.html', 'html', 1, '<u></u>');
      const base = TextDocument.create('file:///src/base.ts', 'typescript', 1, 'export class Base {}');
      const { server } = setup(dependent, other, unrelated, base);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(dependent.getText(), [normalizeFileName(pathOf('file:///src/base.ts'))]));
      registry.resolve.mockImplementation((templatePath: string) => templatePath === pathOf(TEMPLATE_URI) ? components : undefined);
      await server.validate(TEMPLATE_URI);
      vi.mocked(analyzeTemplate).mockClear();

      await server.onDidChangeContent(base);
      await vi.runAllTimersAsync();

      expect(setDocumentOverlay).toHaveBeenCalledWith(pathOf('file:///src/base.ts'), 'export class Base {}');
      expect(invalidateTemplateMetadata).toHaveBeenCalledWith(pathOf('file:///src/base.ts'));
      expect(registry.index).not.toHaveBeenCalled();
      expect(vi.mocked(analyzeTemplate).mock.calls.map(([templatePath]) => templatePath)).toEqual([pathOf(TEMPLATE_URI)]);
    });

    it('indexes a component file again and validates the templates it uses', async () => {
      const component = TextDocument.create(COMPONENT_URI, 'typescript', 2, 'export class App {}');
      const { server } = setup(template(), component);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(template().getText()));

      await server.onDidChangeContent(component);
      await vi.runAllTimersAsync();

      expect(registry.index).toHaveBeenCalledWith(pathOf(COMPONENT_URI));
      expect(analyzeTemplate).toHaveBeenCalledTimes(1);
    });

    it('forgets a closed template, and reads a closed TypeScript file from disk again', async () => {
      const document = template();
      const component = TextDocument.create(COMPONENT_URI, 'typescript', 1, '');
      const { server, connection } = setup(document, component);

      await server.onDidChangeContent(document);
      await server.onDidClose(document);
      await vi.runAllTimersAsync();
      expect(analyzeTemplate).not.toHaveBeenCalled();
      expect(removeTemplateAnalysis).toHaveBeenCalledWith(pathOf(TEMPLATE_URI));
      expect(connection.sendDiagnostics).toHaveBeenCalledWith({ uri: TEMPLATE_URI, diagnostics: [] });

      await server.onDidClose(component);
      expect(removeDocumentOverlay).toHaveBeenCalledWith(pathOf(COMPONENT_URI));
      expect(registry.index).toHaveBeenCalledWith(pathOf(COMPONENT_URI));
    });

    it('applies the changes of the watched files, removing the deleted components from the index', async () => {
      const { server } = setup();

      await server.onDidChangeWatchedFiles({ changes: [{ uri: COMPONENT_URI, type: FileChangeType.Deleted }, { uri: 'file:///src/base.ts', type: FileChangeType.Changed }] });

      expect(registry.remove).toHaveBeenCalledWith(pathOf(COMPONENT_URI));
      expect(registry.remove).toHaveBeenCalledTimes(1);
      expect(invalidateTemplateMetadata).toHaveBeenCalledWith(pathOf('file:///src/base.ts'));
    });
  });

  describe('onDefinition', () => {
    it('locates the definitions in the template itself, in the open documents or in the files on disk', async () => {
      const document = template('<b>{ title }</b>');
      const component = TextDocument.create(COMPONENT_URI, 'typescript', 1, 'class App {\n  title = 1;\n}');
      const { server } = setup(document, component);
      const result = analysisOf(document.getText());
      vi.mocked(analyzeTemplate).mockResolvedValue(result);
      vi.mocked(getTemplateDefinition).mockReturnValue([
        { fileName: pathOf(COMPONENT_URI), span: { start: 14, end: 19 } },
        { fileName: pathOf('file:///src/missing.ts'), span: { start: 0, end: 0 } }
      ]);

      const locations = await server.onDefinition({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 6 } });

      expect(getTemplateDefinition).toHaveBeenCalledWith(result.analysis, 6);
      expect(locations).toEqual([
        { uri: COMPONENT_URI, range: { start: { line: 1, character: 2 }, end: { line: 1, character: 7 } } },
        { uri: 'file:///src/missing.ts', range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } }
      ]);
      // The analysis of the current version of the template is reused
      await server.onDefinition({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 6 } });
      expect(analyzeTemplate).toHaveBeenCalledTimes(1);
    });

    it('finds nothing in a document that is not open, or in a template never compiled', async () => {
      const { server } = setup(template());
      vi.mocked(analyzeTemplate).mockResolvedValue({ analysis: undefined, error: new Error('boom'), ast: undefined });

      expect(await server.onDefinition({ textDocument: { uri: 'file:///closed.html' }, position: { line: 0, character: 0 } })).toEqual([]);
      expect(await server.onDefinition({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 0 } })).toEqual([]);
    });
  });

  describe('onSemanticTokens', () => {
    it('encodes the semantic tokens of the template', async () => {
      const document = template('<my-el value="a">\n  { item }</my-el>');
      const { server } = setup(document);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(document.getText()));
      vi.mocked(getTemplateSemanticTokens).mockReturnValue([
        { span: { start: 7, end: 12 }, type: 'property', modifiers: [] },
        { span: { start: 22, end: 26 }, type: 'variable', modifiers: ['readonly'] }
      ]);

      expect((await server.onSemanticTokens({ textDocument: { uri: TEMPLATE_URI } })).data).toEqual([0, 7, 5, 0, 0, 1, 4, 4, 3, 1]);
    });

    it('returns no tokens for a template that doesn\'t compile, or is not open', async () => {
      const document = template('<my-el');
      const { server } = setup(document);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf('<my-el></my-el>'));

      expect((await server.onSemanticTokens({ textDocument: { uri: TEMPLATE_URI } })).data).toEqual([]);
      expect((await server.onSemanticTokens({ textDocument: { uri: 'file:///closed.html' } })).data).toEqual([]);
      expect(getTemplateSemanticTokens).not.toHaveBeenCalled();
    });
  });

  describe('onCompletion', () => {
    it('proposes the completions of the expression under the cursor', async () => {
      const document = template('<b>{ ti }</b>');
      const { server } = setup(document);
      const result = analysisOf(document.getText());
      vi.mocked(analyzeTemplate).mockResolvedValue(result);
      vi.mocked(getTemplateCompletions).mockReturnValue([{ name: 'title', kind: 'property' as never, sortText: '11' }]);

      expect(await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 7 } })).toEqual([{ label: 'title', kind: CompletionItemKind.Field, sortText: '11' }]);
      expect(getTemplateCompletions).toHaveBeenCalledWith(result.analysis, 7);
    });

    it('proposes nothing for a template that doesn\'t compile', async () => {
      const { server } = setup(template('<b>{ ti '));
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf('<b>{ ti }</b>'));

      expect(await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 7 } })).toEqual([]);
    });
  });

  it('cancels the pending validations and disposes the language services on shutdown', async () => {
    const document = template();
    const { server } = setup(document);

    await server.onDidChangeContent(document);
    server.onShutdown();
    await vi.runAllTimersAsync();

    expect(analyzeTemplate).not.toHaveBeenCalled();
    expect(disposeProjectLanguageServices).toHaveBeenCalled();
  });
});
