import { analyzeTemplate, disposeProjectLanguageServices, findUnusedImports, getComponentDefinition, getTemplateFormatting, getTemplateCompletions, getTemplateDefinition, getTemplateDiagnostics, getTemplateExpressionCompletions, getTemplateHover, getTemplateImportCompletions, getTemplateImportPathCompletions, getTemplateKeywordCompletions, getTemplateSelectorCompletions, getTemplateSemanticTokens, getTemplateSourceBindingCompletions, invalidateTemplateMetadata, normalizeFileName, organizeTemplateImports, removeDocumentOverlay, removeTemplateAnalysis, removeTemplateImport, setDocumentOverlay, type TemplateAnalysis, type TemplateAnalysisResult } from '@xaendar/language-core';
import { DiagnosticCategory } from 'typescript';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItemKind, type Connection, InsertTextFormat, DiagnosticSeverity, DiagnosticTag, FileChangeType, type TextDocuments } from 'vscode-languageserver/node';
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
  getComponentDefinition: vi.fn(async () => []),
  getTemplateHover: vi.fn(() => undefined),
  getTemplateSemanticTokens: vi.fn(() => []),
  getTemplateCompletions: vi.fn(() => []),
  getTemplateSourceBindingCompletions: vi.fn(async () => undefined),
  getTemplateExpressionCompletions: vi.fn(async () => undefined),
  getTemplateKeywordCompletions: vi.fn(() => undefined),
  getTemplateImportCompletions: vi.fn(async () => undefined),
  getTemplateImportPathCompletions: vi.fn(() => undefined),
  getTemplateSelectorCompletions: vi.fn(async () => undefined),
  setDocumentOverlay: vi.fn(),
  removeDocumentOverlay: vi.fn(),
  removeTemplateAnalysis: vi.fn(),
  invalidateTemplateMetadata: vi.fn(),
  findUnusedImports: vi.fn(() => undefined),
  getTemplateFormatting: vi.fn(() => undefined),
  organizeTemplateImports: vi.fn(() => undefined),
  removeTemplateImport: vi.fn(() => undefined),
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
    onHover: capture('hover'),
    onCompletion: capture('completion'),
    onCodeAction: capture('codeAction'),
    onDocumentFormatting: capture('formatting'),
    workspace: { getConfiguration: vi.fn(async () => null) },
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
  analysis: { templatePath: pathOf(TEMPLATE_URI), source, metadatas: [], dependencies: new Set(dependencies) } as unknown as TemplateAnalysis,
  error: undefined,
  ast: []
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  registry.resolve.mockReturnValue(components);
  vi.mocked(getTemplateImportCompletions).mockResolvedValue(undefined);
  vi.mocked(getTemplateImportPathCompletions).mockReturnValue(undefined);
  vi.mocked(getTemplateSelectorCompletions).mockResolvedValue(undefined);
  vi.mocked(findUnusedImports).mockReturnValue(undefined);
  vi.mocked(organizeTemplateImports).mockReturnValue(undefined);
  vi.mocked(getTemplateFormatting).mockReturnValue(undefined);
  vi.mocked(removeTemplateImport).mockReturnValue(undefined);
  vi.mocked(getTemplateSourceBindingCompletions).mockResolvedValue(undefined);
  vi.mocked(getTemplateExpressionCompletions).mockResolvedValue(undefined);
  vi.mocked(getTemplateKeywordCompletions).mockReturnValue(undefined);
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
      onHover: vi.spyOn(server, 'onHover').mockResolvedValue(null),
      onCompletion: vi.spyOn(server, 'onCompletion').mockResolvedValue([]),
      onCodeAction: vi.spyOn(server, 'onCodeAction').mockResolvedValue([]),
      onDocumentFormatting: vi.spyOn(server, 'onDocumentFormatting').mockResolvedValue([]),
      onSemanticTokens: vi.spyOn(server, 'onSemanticTokens').mockResolvedValue({ data: [] }),
      onShutdown: vi.spyOn(server, 'onShutdown').mockReturnValue(),
      onDidChangeContent: vi.spyOn(server, 'onDidChangeContent').mockResolvedValue(),
      onDidClose: vi.spyOn(server, 'onDidClose').mockResolvedValue()
    };

    handlers.initialize({});
    handlers.initialized();
    handlers.watchedFiles({ changes: [] });
    handlers.definition({});
    handlers.hover({});
    handlers.completion({});
    handlers.codeAction({});
    handlers.formatting({});
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
        hoverProvider: true,
        completionProvider: { triggerCharacters: ['.', '(', '<', '@', '*', '/'] },
        codeActionProvider: { codeActionKinds: ['quickfix', 'source.organizeImports'] },
        documentFormattingProvider: true,
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

    it('tags what the template doesn\'t need as unnecessary, so that the editor fades it', async () => {
      const document = template('@import { A } from \'./a\';\n<b></b>');
      const { server, connection } = setup(document);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(document.getText()));
      vi.mocked(getTemplateDiagnostics).mockReturnValue([{ span: { start: 10, end: 11 }, message: '\'A\' is declared but never used.', category: DiagnosticCategory.Suggestion, unnecessary: true }]);

      await server.validate(TEMPLATE_URI);

      expect(connection.sendDiagnostics).toHaveBeenCalledWith({
        uri: TEMPLATE_URI,
        version: 1,
        diagnostics: [{ range: { start: { line: 0, character: 10 }, end: { line: 0, character: 11 } }, message: '\'A\' is declared but never used.', severity: DiagnosticSeverity.Hint, code: undefined, source: 'xaendar', tags: [DiagnosticTag.Unnecessary] }]
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

    it('does not validate again a template that neither depends on the changed TypeScript file nor is used by it', async () => {
      const unrelated = TextDocument.create('file:///src/unrelated.ts', 'typescript', 1, 'export class Unrelated {}');
      const { server } = setup(template(), unrelated);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(template().getText()));
      registry.resolve.mockReturnValue(components);
      await server.validate(TEMPLATE_URI);
      vi.mocked(analyzeTemplate).mockClear();

      await server.onDidChangeContent(unrelated);
      await vi.runAllTimersAsync();

      expect(analyzeTemplate).not.toHaveBeenCalled();
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
        { fileName: pathOf(COMPONENT_URI), span: { start: 14, end: 19 }, origin: { start: 6, end: 11 } },
        { fileName: pathOf('file:///src/missing.ts'), span: { start: 0, end: 0 } }
      ]);

      const locations = await server.onDefinition({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 6 } });

      expect(getTemplateDefinition).toHaveBeenCalledWith(result.analysis, 6);
      expect(locations).toEqual([
        { targetUri: COMPONENT_URI, targetRange: { start: { line: 1, character: 2 }, end: { line: 1, character: 7 } }, targetSelectionRange: { start: { line: 1, character: 2 }, end: { line: 1, character: 7 } }, originSelectionRange: { start: { line: 0, character: 6 }, end: { line: 0, character: 11 } } },
        { targetUri: 'file:///src/missing.ts', targetRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, targetSelectionRange: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } }
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

    it('locates the template and the style a @WebComponent of a component file leads to', async () => {
      const component = TextDocument.create(COMPONENT_URI, 'typescript', 1, 'import x;\n@WebComponent({})');
      const { server } = setup(template(), component);
      vi.mocked(getComponentDefinition).mockResolvedValue([
        { fileName: pathOf(TEMPLATE_URI), span: { start: 0, end: 0 } },
        { fileName: pathOf('file:///src/app.css'), span: { start: 0, end: 0 } }
      ]);

      const locations = await server.onDefinition({ textDocument: { uri: COMPONENT_URI }, position: { line: 1, character: 3 } });

      expect(getComponentDefinition).toHaveBeenCalledWith(pathOf(COMPONENT_URI), component.getText(), 13);
      expect(locations.map(({ targetUri }) => targetUri)).toEqual([TEMPLATE_URI, 'file:///src/app.css']);
      expect(analyzeTemplate).not.toHaveBeenCalled();
    });
  });

  describe('onHover', () => {
    it('shows the documentation of the symbol under the cursor, as markdown on the span it refers to', async () => {
      const contents = '```ts\nclass MyEl\n```\n\nA component.';
      const document = template('<my-el value="a"></my-el>');
      const { server } = setup(document);
      const result = analysisOf(document.getText());
      vi.mocked(analyzeTemplate).mockResolvedValue(result);
      vi.mocked(getTemplateHover).mockReturnValue({ contents, span: { start: 1, end: 6 } });

      expect(await server.onHover({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 3 } })).toEqual({
        contents: { kind: 'markdown', value: contents },
        range: { start: { line: 0, character: 1 }, end: { line: 0, character: 6 } }
      });
      expect(getTemplateHover).toHaveBeenCalledWith(result.analysis, 3);
    });

    it('shows nothing where there is nothing to show, in a template that doesn\'t compile, or in a document that is not open', async () => {
      const { server } = setup(template('<my-el'));
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf('<my-el></my-el>'));

      expect(await server.onHover({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 3 } })).toBeNull();
      expect(await server.onHover({ textDocument: { uri: 'file:///closed.html' }, position: { line: 0, character: 3 } })).toBeNull();
      expect(getTemplateHover).not.toHaveBeenCalled();
    });

    it('shows nothing when there is no hover at the position', async () => {
      const document = template('<b></b>');
      const { server } = setup(document);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(document.getText()));
      vi.mocked(getTemplateHover).mockReturnValue(undefined);

      expect(await server.onHover({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 0 } })).toBeNull();
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

  describe('onDocumentFormatting', () => {
    const request = (insertSpaces = true, tabSize = 2) => ({ textDocument: { uri: TEMPLATE_URI }, options: { insertSpaces, tabSize } });
    const formatting = { span: { start: 0, end: 8 }, newText: '<p>\n</p>\n' };

    it('replaces the template with the formatted one, indented like the editor', async () => {
      const { server } = setup(template('<p></p>'));
      vi.mocked(getTemplateFormatting).mockReturnValue(formatting);

      const edits = await server.onDocumentFormatting(request(true, 4));

      expect(getTemplateFormatting).toHaveBeenCalledWith('<p></p>', { indent: '    ', indentWidth: 4, printWidth: 120 });
      expect(edits).toEqual([{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 7 } }, newText: '<p>\n</p>\n' }]);
    });

    it('indents with a tab when the editor does', async () => {
      const { server } = setup(template('<p></p>'));

      await server.onDocumentFormatting(request(false, 4));

      expect(getTemplateFormatting).toHaveBeenCalledWith('<p></p>', { indent: '\t', indentWidth: 4, printWidth: 120 });
    });

    it('reads the width of the lines from the settings of the client', async () => {
      const { server, connection } = setup(template('<p></p>'));
      server.onInitialize({ workspaceFolders: null, capabilities: { workspace: { configuration: true } } } as never);
      connection.workspace.getConfiguration.mockResolvedValue({ printWidth: 80 });

      await server.onDocumentFormatting(request());

      expect(connection.workspace.getConfiguration).toHaveBeenCalledWith({ scopeUri: TEMPLATE_URI, section: 'xaendar.format' });
      expect(getTemplateFormatting).toHaveBeenCalledWith('<p></p>', expect.objectContaining({ printWidth: 80 }));
    });

    it.each([
      ['no setting', null],
      ['a width that is not a number', { printWidth: '80' }],
      ['a width that is too narrow', { printWidth: 10 }]
    ])('uses the default width for %s', async (_name, settings) => {
      const { server, connection } = setup(template('<p></p>'));
      server.onInitialize({ workspaceFolders: null, capabilities: { workspace: { configuration: true } } } as never);
      connection.workspace.getConfiguration.mockResolvedValue(settings);

      await server.onDocumentFormatting(request());

      expect(getTemplateFormatting).toHaveBeenCalledWith('<p></p>', expect.objectContaining({ printWidth: 120 }));
    });

    it('does not ask for the settings when the client cannot give them', async () => {
      const { server, connection } = setup(template('<p></p>'));

      await server.onDocumentFormatting(request());

      expect(connection.workspace.getConfiguration).not.toHaveBeenCalled();
    });

    it('returns no edits for a template that is already formatted or cannot be read, a document that is not a template, or not open', async () => {
      const component = TextDocument.create(COMPONENT_URI, 'typescript', 1, 'export class App {}');
      const { server } = setup(template('<p></p>'), component);

      expect(await server.onDocumentFormatting(request())).toEqual([]);
      expect(await server.onDocumentFormatting({ ...request(), textDocument: { uri: COMPONENT_URI } })).toEqual([]);
      expect(await server.onDocumentFormatting({ ...request(), textDocument: { uri: 'file:///closed.xd.component.html' } })).toEqual([]);
      expect(getTemplateFormatting).toHaveBeenCalledTimes(1);
    });
  });

  describe('onCodeAction', () => {
    const source = '@import { A, B } from \'./a\';\n<a-b></a-b>';
    const request = (only?: string[], character = 13) => ({ textDocument: { uri: TEMPLATE_URI }, range: { start: { line: 0, character }, end: { line: 0, character } }, context: { diagnostics: [], only } });
    const change = { span: { start: 10, end: 15 }, newText: ' A ' };
    const edit = { changes: { [TEMPLATE_URI]: [{ range: { start: { line: 0, character: 10 }, end: { line: 0, character: 15 } }, newText: ' A ' }] } };

    it('proposes to remove the unused import under the cursor, and to organize the imports', async () => {
      const document = template(source);
      const { server } = setup(document);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(source));
      vi.mocked(findUnusedImports).mockReturnValue([{ span: { start: 13, end: 14 }, name: 'B', key: './a|B' }]);
      vi.mocked(removeTemplateImport).mockReturnValue(change);
      vi.mocked(organizeTemplateImports).mockReturnValue(change);

      const actions = await server.onCodeAction(request());

      expect(removeTemplateImport).toHaveBeenCalledWith(source, { span: { start: 13, end: 14 }, name: 'B', key: './a|B' });
      expect(organizeTemplateImports).toHaveBeenCalledWith(source, expect.objectContaining({ source }));
      expect(actions).toEqual([
        { title: 'Remove unused import \'B\'', kind: 'quickfix', isPreferred: true, edit },
        { title: 'Organize imports', kind: 'source.organizeImports', edit }
      ]);
    });

    it('proposes to remove an unused import only where the cursor is on it', async () => {
      const { server } = setup(template(source));
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(source));
      vi.mocked(findUnusedImports).mockReturnValue([{ span: { start: 13, end: 14 }, name: 'B', key: './a|B' }]);
      vi.mocked(removeTemplateImport).mockReturnValue(change);

      expect(await server.onCodeAction(request(undefined, 0))).toEqual([]);
      expect(removeTemplateImport).not.toHaveBeenCalled();
    });

    it('proposes only the kind of action asked for', async () => {
      const { server } = setup(template(source));
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(source));
      vi.mocked(findUnusedImports).mockReturnValue([{ span: { start: 13, end: 14 }, name: 'B', key: './a|B' }]);
      vi.mocked(removeTemplateImport).mockReturnValue(change);
      vi.mocked(organizeTemplateImports).mockReturnValue(change);

      expect((await server.onCodeAction(request(['source.organizeImports']))).map(({ kind }) => kind)).toEqual(['source.organizeImports']);
      expect((await server.onCodeAction(request(['source']))).map(({ kind }) => kind)).toEqual(['source.organizeImports']);
      expect((await server.onCodeAction(request(['quickfix']))).map(({ kind }) => kind)).toEqual(['quickfix']);
      expect(await server.onCodeAction(request(['refactor']))).toEqual([]);
    });

    it('does not remove anything when the analysis is not the one of the current text, and only proposes to organize', async () => {
      const { server } = setup(template(source));
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf('<b></b>'));
      vi.mocked(organizeTemplateImports).mockReturnValue(change);

      const actions = await server.onCodeAction(request());

      expect(findUnusedImports).not.toHaveBeenCalled();
      expect(actions.map(({ kind }) => kind)).toEqual(['source.organizeImports']);
    });

    it('proposes nothing when the imports are organized, for a document that is not open, or not a template', async () => {
      const component = TextDocument.create(COMPONENT_URI, 'typescript', 1, 'export class App {}');
      const { server } = setup(template(source), component);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(source));

      expect(await server.onCodeAction(request())).toEqual([]);
      expect(await server.onCodeAction({ ...request(), textDocument: { uri: COMPONENT_URI } })).toEqual([]);
      expect(await server.onCodeAction({ ...request(), textDocument: { uri: 'file:///closed.xd.component.html' } })).toEqual([]);
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

    it('proposes nothing in an expression of a template that doesn\'t compile, or after the ( of a call', async () => {
      const { server } = setup(template('<b>{ ti '));
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf('<b>{ ti }</b>'));

      expect(await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 7 } })).toEqual([]);

      const call = template('<b>{ f( }</b>', 2);
      const { server: callServer } = setup(call);
      vi.mocked(analyzeTemplate).mockResolvedValue(analysisOf(call.getText()));

      expect(await callServer.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 7 }, context: { triggerKind: 2, triggerCharacter: '(' } })).toEqual([]);
      expect(getTemplateCompletions).not.toHaveBeenCalled();
    });

    it('proposes the blocks that can be written after a @ as snippets, suggesting again in their condition once inserted', async () => {
      const document = template('<p></p>\n@');
      const { server } = setup(document);
      const replacementSpan = { start: 8, end: 9 };
      vi.mocked(getTemplateKeywordCompletions).mockReturnValue([
        { name: '@if', kind: 'keyword' as never, sortText: '0', replacementSpan, snippet: '@if ($1) {\n\t$0\n}', retrigger: true },
        { name: '@else', kind: 'keyword' as never, sortText: '1', replacementSpan, snippet: '@else {\n\t$0\n}', retrigger: false }
      ]);

      const items = await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 1, character: 1 }, context: { triggerKind: 2, triggerCharacter: '@' } });

      expect(getTemplateKeywordCompletions).toHaveBeenCalledWith(document.getText(), 9);
      const range = { start: { line: 1, character: 0 }, end: { line: 1, character: 1 } };
      expect(items).toEqual([{
        label: '@if',
        kind: CompletionItemKind.Keyword,
        sortText: '0',
        textEdit: { range, newText: '@if ($1) {\n\t$0\n}' },
        insertTextFormat: InsertTextFormat.Snippet,
        command: { title: 'Suggest', command: 'editor.action.triggerSuggest' }
      }, {
        label: '@else',
        kind: CompletionItemKind.Keyword,
        sortText: '1',
        textEdit: { range, newText: '@else {\n\t$0\n}' },
        insertTextFormat: InsertTextFormat.Snippet
      }]);
      expect(getTemplateExpressionCompletions).not.toHaveBeenCalled();
    });

    it('proposes the variables of the template and the members of the component in an expression, also while the template doesn\'t compile', async () => {
      const document = template('<b (click)="pick($e">x</b>');
      const { server } = setup(document);
      vi.mocked(getTemplateExpressionCompletions).mockResolvedValue([{ name: '$event', kind: 'let' as never, sortText: '0', replacementSpan: { start: 17, end: 19 } }]);

      const items = await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 19 }, context: { triggerKind: 2, triggerCharacter: '(' } });

      expect(getTemplateExpressionCompletions).toHaveBeenCalledWith(pathOf(TEMPLATE_URI), document.getText(), 19, components, '(');
      expect(items).toEqual([{ label: '$event', kind: CompletionItemKind.Variable, sortText: '0', textEdit: { range: { start: { line: 0, character: 17 }, end: { line: 0, character: 19 } }, newText: '$event' } }]);
      expect(analyzeTemplate).not.toHaveBeenCalled();
    });

    it('leaves the expressions of a template no component uses to TypeScript', async () => {
      const { server } = setup(template('<b>{ ti }</b>'));
      registry.resolve.mockReturnValue(undefined);

      expect(await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 7 } })).toEqual([]);
      expect(getTemplateExpressionCompletions).not.toHaveBeenCalled();
    });

    it('proposes the imported components and directives on a selector, also while the template doesn\'t compile', async () => {
      const document = template('@import { MyEl } from \'./my-el\';\n<my');
      const { server } = setup(document);
      vi.mocked(getTemplateSelectorCompletions).mockResolvedValue([{ name: 'my-el', kind: 'component', sortText: '0', replacementSpan: { start: 34, end: 36 } }]);

      const items = await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 1, character: 3 } });

      expect(getTemplateSelectorCompletions).toHaveBeenCalledWith(pathOf(TEMPLATE_URI), document.getText(), 36);
      expect(items).toEqual([{ label: 'my-el', kind: CompletionItemKind.Class, sortText: '0', textEdit: { range: { start: { line: 1, character: 1 }, end: { line: 1, character: 3 } }, newText: 'my-el' } }]);
      expect(analyzeTemplate).not.toHaveBeenCalled();
    });

    it('adds the import of a component not imported yet to the completion item', async () => {
      const document = template('<my');
      const { server } = setup(document);
      vi.mocked(getTemplateSelectorCompletions).mockResolvedValue([{
        name: 'my-el',
        kind: 'component',
        detail: 'MyEl - ./my-el',
        sortText: '1',
        replacementSpan: { start: 1, end: 3 },
        additionalEdits: [{ span: { start: 0, end: 0 }, newText: '@import { MyEl } from \'./my-el\';\n' }]
      }]);

      const [item] = await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 3 } });

      expect(item.additionalTextEdits).toEqual([{ range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } }, newText: '@import { MyEl } from \'./my-el\';\n' }]);
      expect(item.detail).toBe('MyEl - ./my-el');
    });

    it('proposes the components and directives of a module between the braces of an @import, with their selector', async () => {
      const document = template('@import {  } from \'./my-el\';');
      const { server } = setup(document);
      vi.mocked(getTemplateImportCompletions).mockResolvedValue([{ name: 'MyEl', kind: 'component', detail: 'my-el', sortText: '0', replacementSpan: { start: 10, end: 10 } }]);

      const items = await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 10 } });

      expect(getTemplateImportCompletions).toHaveBeenCalledWith(pathOf(TEMPLATE_URI), document.getText(), 10);
      expect(items).toEqual([{ label: 'MyEl', kind: CompletionItemKind.Class, detail: 'my-el', sortText: '0', textEdit: { range: { start: { line: 0, character: 10 }, end: { line: 0, character: 10 } }, newText: 'MyEl' } }]);
      expect(getTemplateSelectorCompletions).not.toHaveBeenCalled();
      expect(analyzeTemplate).not.toHaveBeenCalled();
    });

    it('proposes the modules and directories in the path of an @import', async () => {
      const document = template('@import { A } from \'./\';');
      const { server } = setup(document);
      vi.mocked(getTemplateImportPathCompletions).mockReturnValue([{ name: 'ui/', kind: 'directory' as never, sortText: '0', replacementSpan: { start: 22, end: 22 } }]);

      const items = await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 22 } });

      expect(getTemplateImportPathCompletions).toHaveBeenCalledWith(pathOf(TEMPLATE_URI), document.getText(), 22);
      expect(items).toEqual([{ label: 'ui/', kind: CompletionItemKind.Folder, sortText: '0', textEdit: { range: { start: { line: 0, character: 22 }, end: { line: 0, character: 22 } }, newText: 'ui/' } }]);
      expect(getTemplateImportCompletions).not.toHaveBeenCalled();
    });

    it('does not look for selectors in a document that is not a template, or that is not open', async () => {
      const component = TextDocument.create(COMPONENT_URI, 'typescript', 1, '<my');
      const { server } = setup(component);

      expect(await server.onCompletion({ textDocument: { uri: COMPONENT_URI }, position: { line: 0, character: 3 } })).toEqual([]);
      expect(await server.onCompletion({ textDocument: { uri: 'file:///closed.html' }, position: { line: 0, character: 3 } })).toEqual([]);
      expect(getTemplateSelectorCompletions).not.toHaveBeenCalled();
      expect(getTemplateImportCompletions).not.toHaveBeenCalled();
      expect(getTemplateImportPathCompletions).not.toHaveBeenCalled();
    });

    it('proposes the bindings of a component on the name of an attribute, also while the template doesn\'t compile', async () => {
      const document = template('<my-el\n  la');
      const { server } = setup(document);
      vi.mocked(getTemplateSourceBindingCompletions).mockResolvedValue([
        { name: 'label', kind: 'property' as never, sortText: '0', replacementSpan: { start: 9, end: 11 } },
        { name: '(picked)', kind: 'event', sortText: '1', replacementSpan: { start: 9, end: 11 } }
      ]);

      const items = await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 1, character: 4 } });

      // The template is not analyzed: its imports are read from the source
      expect(getTemplateSourceBindingCompletions).toHaveBeenCalledWith(pathOf(TEMPLATE_URI), document.getText(), 11);
      expect(analyzeTemplate).not.toHaveBeenCalled();
      const range = { start: { line: 1, character: 2 }, end: { line: 1, character: 4 } };
      expect(items).toEqual([
        { label: 'label', kind: CompletionItemKind.Field, sortText: '0', textEdit: { range, newText: 'label' } },
        { label: '(picked)', kind: CompletionItemKind.Event, sortText: '1', textEdit: { range, newText: '(picked)' } }
      ]);
      expect(getTemplateCompletions).not.toHaveBeenCalled();
    });

    it('proposes nothing in a document that is not open, or in a template never compiled', async () => {
      const { server } = setup(template());
      vi.mocked(analyzeTemplate).mockResolvedValue({ analysis: undefined, error: new Error('boom'), ast: undefined });

      expect(await server.onCompletion({ textDocument: { uri: 'file:///closed.html' }, position: { line: 0, character: 0 } })).toEqual([]);
      expect(await server.onCompletion({ textDocument: { uri: TEMPLATE_URI }, position: { line: 0, character: 0 } })).toEqual([]);
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
