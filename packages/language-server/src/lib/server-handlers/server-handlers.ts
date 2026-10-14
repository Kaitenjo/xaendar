import { analyzeTemplate, disposeProjectLanguageServices, getComponentDefinition, getTemplateCompletions, getTemplateDefinition, getTemplateDiagnostics, getTemplateHover, getTemplateImportCompletions, getTemplateImportPathCompletions, getTemplateSelectorCompletions, getTemplateSemanticTokens, getTemplateSourceBindingCompletions, invalidateTemplateMetadata, normalizeFileName, removeDocumentOverlay, removeTemplateAnalysis, setDocumentOverlay, TEMPLATE_SEMANTIC_TOKEN_MODIFIERS, TEMPLATE_SEMANTIC_TOKEN_TYPES, type TemplateAnalysis, type TemplateAnalysisResult, type TemplateCompletion, type TemplateDefinition } from '@xaendar/language-core';
import type { TextDocument } from 'vscode-languageserver-textdocument';
import { type CompletionItem, type CompletionParams, type Connection, type DefinitionParams, type DidChangeWatchedFilesParams, FileChangeType, type Hover, type HoverParams, type InitializeParams, type InitializeResult, type LocationLink, MarkupKind, type SemanticTokens, SemanticTokensBuilder, type SemanticTokensParams, TextDocumentSyncKind, type TextDocuments } from 'vscode-languageserver/node';
import { COMPONENT_FILE_SUFFIX, TemplateRegistry } from '../template-registry/template-registry';
import { Debouncer } from '../utils/debounce/debounce.utils';
import { fromUri, getDocument, toCompletionItemKind, toRange, toSeverity } from '../utils/lsp/lsp.utils';

/**
 * Suffix of the templates of the components.
 */
const TEMPLATE_SUFFIX = '.xd.component.html';

/**
 * Milliseconds a template waits, after the last change, before being validated again.
 */
const VALIDATION_DELAY = 250;

/**
 * The analysis of an open template, together with the version of the document it was made from.
 */
type DocumentAnalysis = {
  /**
   * The version of the document analyzed.
   */
  readonly version: number;
  /**
   * The analysis.
   */
  readonly result: TemplateAnalysisResult;
};

/**
 * The Xaendar language server: diagnostics, definitions, hovers, semantic tokens and completions for the templates open in
 * the editor. The TypeScript files of the components the client synchronizes are only read, so that the templates
 * see their unsaved changes.
 */
export class XaendarLanguageServer {
  /**
   * The template ↔ component index of the workspace.
   */
  private readonly _registry = new TemplateRegistry();
  /**
   * The validations of the templates pending while the user is typing, keyed by URI.
   */
  private readonly _validations = new Debouncer(VALIDATION_DELAY);
  /**
   * The last analysis of each open template, keyed by URI.
   */
  private readonly _analyses = new Map<string, DocumentAnalysis>();
  /**
   * The absolute paths of the workspace folders.
   */
  private _workspaceRoots = new Array<string>();

  /**
   * Creates the server.
   *
   * @param _connection - The connection with the client.
   * @param _documents - The documents open in the client.
   */
  constructor(private readonly _connection: Connection, private readonly _documents: TextDocuments<TextDocument>) { }

  /**
   * Registers the handlers and starts listening to the client.
   */
  public listen(): void {
    const connection = this._connection;
    connection.onInitialize(params => this.onInitialize(params));
    connection.onInitialized(() => this.onInitialized());
    connection.onDidChangeWatchedFiles(params => this.onDidChangeWatchedFiles(params));
    connection.onDefinition(params => this.onDefinition(params));
    connection.onHover(params => this.onHover(params));
    connection.onCompletion(params => this.onCompletion(params));
    connection.languages.semanticTokens.on(params => this.onSemanticTokens(params));
    connection.onShutdown(() => this.onShutdown());
    this._documents.onDidChangeContent(({ document }) => this.onDidChangeContent(document));
    this._documents.onDidClose(({ document }) => this.onDidClose(document));
    this._documents.listen(connection);
    connection.listen();
  }

  /**
   * Captures the workspace folders and declares the capabilities of the server.
   *
   * @param params - The initialize request.
   * @returns The capabilities of the server.
   */
  public onInitialize({ workspaceFolders, rootUri }: InitializeParams): InitializeResult {
    this._workspaceRoots = workspaceFolders?.map(({ uri }) => fromUri(uri)) ?? (rootUri ? [fromUri(rootUri)] : []);

    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        definitionProvider: true,
        hoverProvider: true,
        completionProvider: { triggerCharacters: ['.', '(', '<', '@', '*', '/'] },
        semanticTokensProvider: {
          legend: { tokenTypes: [...TEMPLATE_SEMANTIC_TOKEN_TYPES], tokenModifiers: [...TEMPLATE_SEMANTIC_TOKEN_MODIFIERS] },
          full: true
        }
      }
    };
  }

  /**
   * Indexes the components of the workspace, then validates the templates already open.
   */
  public async onInitialized(): Promise<void> {
    await this._registry.build(this._workspaceRoots);
    const templates = this._documents.all().filter(isTemplate);
    for (let i = 0; i < templates.length; i++) {
      this._scheduleValidation(templates[i].uri);
    }
  }

  /**
   * Validates a template again after a change, or applies the change of a TypeScript file to the templates depending on it.
   *
   * @param document - The changed document.
   */
  public async onDidChangeContent(document: TextDocument): Promise<void> {
    if (isTemplate(document)) {
      this._scheduleValidation(document.uri);
    } else {
      const fileName = fromUri(document.uri);
      setDocumentOverlay(fileName, document.getText());
      await this._onTypeScriptFileChanged(fileName);
    }
  }

  /**
   * Forgets a closed template, or reads the file on disk again for a closed TypeScript file.
   *
   * @param document - The closed document.
   */
  public async onDidClose(document: TextDocument): Promise<void> {
    if (isTemplate(document)) {
      this._validations.cancel(document.uri);
      this._analyses.delete(document.uri);
      removeTemplateAnalysis(fromUri(document.uri));
      await this._connection.sendDiagnostics({ uri: document.uri, diagnostics: [] });
    } else {
      const fileName = fromUri(document.uri);
      removeDocumentOverlay(fileName);
      await this._onTypeScriptFileChanged(fileName);
    }
  }

  /**
   * Applies the changes of the TypeScript files watched by the client to the templates depending on them.
   *
   * @param params - The changes.
   */
  public async onDidChangeWatchedFiles({ changes }: DidChangeWatchedFilesParams): Promise<void> {
    for (let i = 0; i < changes.length; i++) {
      const { uri, type } = changes[i];
      const fileName = fromUri(uri);
      if (type === FileChangeType.Deleted) {
        this._registry.remove(fileName);
      }

      await this._onTypeScriptFileChanged(fileName);
    }
  }

  /**
   * Finds the definitions of the symbol under the cursor in a template, or, in a component file, the template and
   * the style a `@WebComponent` decorator leads to.
   *
   * @param params - The definition request.
   * @returns The locations of the definitions.
   */
  public async onDefinition({ textDocument, position }: DefinitionParams): Promise<LocationLink[]> {
    const document = this._documents.get(textDocument.uri);
    if (!document) {
      return [];
    }

    const offset = document.offsetAt(position);
    if (!isTemplate(document)) {
      return this._toLocations(await getComponentDefinition(fromUri(document.uri), document.getText(), offset), document);
    }

    const analysis = (await this._getAnalysis(document))?.analysis;
    return analysis ? this._toLocations(getTemplateDefinition(analysis, offset), document) : [];
  }

  /**
   * Shows the signature and the JSDoc of the component, directive, property, event or symbol of an expression under
   * the cursor in a template, nothing while it doesn't compile.
   *
   * @param params - The hover request.
   * @returns The hover, `null` if there is nothing to show.
   */
  public async onHover({ textDocument, position }: HoverParams): Promise<Hover | null> {
    const document = this._documents.get(textDocument.uri);
    if (!document) {
      return null;
    }

    const analysis = await this._getCurrentAnalysis(document);
    const hover = analysis && getTemplateHover(analysis, document.offsetAt(position));
    return hover ? { contents: { kind: MarkupKind.Markdown, value: hover.contents }, range: toRange(document, hover.span) } : null;
  }

  /**
   * Computes the semantic tokens of a template, none while it doesn't compile.
   *
   * @param params - The semantic tokens request.
   * @returns The semantic tokens, encoded.
   */
  public async onSemanticTokens({ textDocument }: SemanticTokensParams): Promise<SemanticTokens> {
    const builder = new SemanticTokensBuilder();
    const document = this._documents.get(textDocument.uri);
    const analysis = document && await this._getCurrentAnalysis(document);

    const tokens = analysis ? getTemplateSemanticTokens(analysis) : [];
    for (let i = 0; i < tokens.length; i++) {
      const { span, type, modifiers } = tokens[i];
      const { line, character } = document!.positionAt(span.start);
      const modifierBits = modifiers.reduce((bits, modifier) => bits | 1 << TEMPLATE_SEMANTIC_TOKEN_MODIFIERS.indexOf(modifier), 0);
      builder.push(line, character, span.end - span.start, TEMPLATE_SEMANTIC_TOKEN_TYPES.indexOf(type), modifierBits);
    }

    return builder.build();
  }

  /**
   * Proposes the completions at the cursor in a template: in the path of an `@import`, the modules and directories;
   * between its braces, the components and directives the module declares; on the tag name of an element or the
   * selector of a directive, the components and directives imported by the template; on the name of an attribute or
   * event, the bindings of the component or directive; all of them also while the template doesn't compile; in an
   * expression, the ones of TypeScript, none while the template doesn't compile or when the completion was triggered by
   * the `(` of a call.
   *
   * @param params - The completion request.
   * @returns The completion items.
   */
  public async onCompletion({ textDocument, position, context }: CompletionParams): Promise<CompletionItem[]> {
    const document = this._documents.get(textDocument.uri);
    if (!document) {
      return [];
    }

    const offset = document.offsetAt(position);
    const templatePath = fromUri(document.uri);
    const imports = isTemplate(document)
      ? getTemplateImportPathCompletions(templatePath, document.getText(), offset)
        ?? await getTemplateImportCompletions(templatePath, document.getText(), offset)
        ?? await getTemplateSelectorCompletions(templatePath, document.getText(), offset)
        ?? await getTemplateSourceBindingCompletions(templatePath, document.getText(), offset)
      : undefined;
    if (imports) {
      return this._toCompletionItems(imports, document);
    }

    const analysis = (await this._getAnalysis(document))?.analysis;
    if (!analysis) {
      return [];
    }

    return this._toCompletionItems(analysis.source === document.getText() && context?.triggerCharacter !== '(' ? getTemplateCompletions(analysis, offset) : [], document);
  }

  /**
   * Cancels the pending validations and disposes the language services of the projects.
   */
  public onShutdown(): void {
    this._validations.dispose();
    disposeProjectLanguageServices();
  }

  /**
   * Analyzes a template and publishes its diagnostics.
   *
   * @param uri - The URI of the template.
   * @returns The analysis, `undefined` if the template is not open or no component uses it.
   */
  public async validate(uri: string): Promise<TemplateAnalysisResult | undefined> {
    this._validations.cancel(uri);
    const document = this._documents.get(uri);
    const templatePath = fromUri(uri);
    const components = this._registry.resolve(templatePath);
    if (!document || !components) {
      await this._connection.sendDiagnostics({ uri, diagnostics: [] });
      return undefined;
    }

    const { version } = document;
    const result = await analyzeTemplate(templatePath, document.getText(), components);
    this._analyses.set(uri, { version, result });

    await this._connection.sendDiagnostics({
      uri,
      version,
      diagnostics: getTemplateDiagnostics(result).map(({ span, message, category, code }) => ({
        range: toRange(document, span),
        message,
        severity: toSeverity(category),
        code,
        source: 'xaendar'
      }))
    });

    return result;
  }

  /**
   * Returns the analysis of the current version of a template, analyzing it if needed.
   *
   * @param document - The template.
   * @returns The analysis, `undefined` if no component uses the template.
   */
  private async _getAnalysis(document: TextDocument): Promise<TemplateAnalysisResult | undefined> {
    const analysis = this._analyses.get(document.uri);
    return analysis?.version === document.version ? analysis.result : await this.validate(document.uri);
  }

  /**
   * Returns the analysis of a template only if made from its current text, i.e. if the template compiles: the last
   * successful analysis of a template that doesn't compile anymore has other offsets.
   *
   * @param document - The template.
   * @returns The analysis of the current text, if any.
   */
  private async _getCurrentAnalysis(document: TextDocument): Promise<TemplateAnalysis | undefined> {
    const analysis = (await this._getAnalysis(document))?.analysis;
    return analysis?.source === document.getText() ? analysis : undefined;
  }

  /**
   * Converts definitions into the locations of the client, reading the files not open in the editor from disk.
   *
   * @param definitions - The definitions.
   * @param source - The document the definitions were requested from.
   * @returns The locations of the definitions.
   */
  private _toLocations(definitions: readonly TemplateDefinition[], source: TextDocument): LocationLink[] {
    return definitions.map(({ fileName, span, origin }) => {
      const target = getDocument(fileName, uri => this._documents.get(uri));
      const range = toRange(target, span);
      const location: LocationLink = { targetUri: target.uri, targetRange: range, targetSelectionRange: range };
      if (origin) {
        location.originSelectionRange = toRange(source, origin);
      }

      return location;
    });
  }

  /**
   * Converts completions into the items of the client.
   *
   * @param completions - The completions.
   * @param document - The document the completions were requested from.
   * @returns The completion items.
   */
  private _toCompletionItems(completions: readonly TemplateCompletion[], document: TextDocument): CompletionItem[] {
    return completions.map(({ name, kind, sortText, detail, replacementSpan, additionalEdits }) => {
      const item: CompletionItem = { label: name, kind: toCompletionItemKind(kind), sortText, detail };
      if (replacementSpan) {
        item.textEdit = { range: toRange(document, replacementSpan), newText: name };
      }

      if (additionalEdits?.length) {
        item.additionalTextEdits = additionalEdits.map(({ span, newText }) => ({ range: toRange(document, span), newText }));
      }

      return item;
    });
  }

  /**
   * Applies the change of a TypeScript file: the metadata extracted from it are discarded, the index is updated if
   * it declares components, and the open templates depending on it are validated again.
   *
   * @param fileName - The path of the changed file.
   */
  private async _onTypeScriptFileChanged(fileName: string): Promise<void> {
    invalidateTemplateMetadata(fileName);
    if (fileName.endsWith(COMPONENT_FILE_SUFFIX)) {
      await this._registry.index(fileName);
    }

    const key = normalizeFileName(fileName);
    const templates = this._documents.all().filter(isTemplate);
    for (let i = 0; i < templates.length; i++) {
      const document = templates[i];
      const dependencies = this._analyses.get(document.uri)?.result.analysis?.dependencies;
      let isAffected = !!dependencies?.has(key);
      const components = this._registry.resolve(fromUri(document.uri));
      if (!isAffected && components?.size) {
        for (const componentFile of components.keys()) {
          if (normalizeFileName(componentFile) === key) {
            isAffected = true;
            break;
          }
        }
      }

      if (isAffected) {
        this._scheduleValidation(document.uri);
      }
    }
  }

  /**
   * Schedules the validation of a template, after the user stops typing in it.
   *
   * @param uri - The URI of the template.
   */
  private _scheduleValidation(uri: string): void {
    this._validations.schedule(uri, () => this.validate(uri));
  }
}

/**
 * Tells whether a document is the template of a component.
 *
 * @param document - The document.
 * @returns `true` if the document is a template.
 */
function isTemplate(document: TextDocument): boolean {
  return document.uri.endsWith(TEMPLATE_SUFFIX);
}

