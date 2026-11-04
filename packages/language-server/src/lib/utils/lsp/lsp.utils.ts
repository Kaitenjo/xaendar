import type { Span } from '@xaendar/compiler';
import { readDocument } from '@xaendar/language-core';
import { DiagnosticCategory, ScriptElementKind } from 'typescript';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItemKind, DiagnosticSeverity, type Range } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';

/**
 * Converts an LSP or file URI to the corresponding filesystem path.
 *
 * @param uri - URI to convert.
 * @returns The URI's filesystem path.
 */
export function fromUri(uri: string): string {
  return URI.parse(uri).fsPath;
}

/**
 * Converts a filesystem path to the URI the client identifies its documents with.
 *
 * @param fileName - The path to convert.
 * @returns The `file` URI of the path.
 */
export function toUri(fileName: string): string {
  return URI.file(fileName).toString();
}

/**
 * Converts a span of a document into an LSP range.
 *
 * @param document - The document.
 * @param span - The span.
 * @returns The range of the span in the document.
 */
export function toRange(document: TextDocument, span: Span): Range {
  return { start: document.positionAt(span.start), end: document.positionAt(span.end) };
}

/**
 * Returns the document of a file: the one open in the editor, or one holding the text of the file on disk.
 *
 * @param fileName - The path of the file.
 * @param getOpenDocument - Returns the document open in the editor for a URI, if any.
 * @returns The document of the file, empty if the file cannot be read.
 */
export function getDocument(fileName: string, getOpenDocument: (uri: string) => TextDocument | undefined): TextDocument {
  const uri = toUri(fileName);
  return getOpenDocument(uri) ?? TextDocument.create(uri, 'typescript', 0, readDocument(fileName) ?? '');
}

/**
 * Maps a TypeScript diagnostic category to an LSP diagnostic severity.
 *
 * @param category - TypeScript diagnostic category.
 * @returns The matching LSP diagnostic severity.
 */
export function toSeverity(category: DiagnosticCategory): DiagnosticSeverity {
  switch (category) {
    case DiagnosticCategory.Error:
      return DiagnosticSeverity.Error;
    case DiagnosticCategory.Warning:
      return DiagnosticSeverity.Warning;
    case DiagnosticCategory.Suggestion:
      return DiagnosticSeverity.Hint;
    default:
      return DiagnosticSeverity.Information;
  }
}

/**
 * Maps the kind of a template completion, a TypeScript script element kind, `event`, `component` or `directive`, to an LSP completion item kind.
 *
 * @param kind - The kind of the completion.
 * @returns The matching LSP completion item kind.
 */
export function toCompletionItemKind(kind: string): CompletionItemKind {
  switch (kind) {
    case ScriptElementKind.memberVariableElement:
    case ScriptElementKind.memberGetAccessorElement:
    case ScriptElementKind.memberSetAccessorElement:
      return CompletionItemKind.Field;
    case ScriptElementKind.memberFunctionElement:
      return CompletionItemKind.Method;
    case ScriptElementKind.functionElement:
      return CompletionItemKind.Function;
    case ScriptElementKind.variableElement:
    case ScriptElementKind.letElement:
    case ScriptElementKind.constElement:
      return CompletionItemKind.Variable;
    case ScriptElementKind.classElement:
      return CompletionItemKind.Class;
    case ScriptElementKind.directory:
      return CompletionItemKind.Folder;
    case ScriptElementKind.scriptElement:
      return CompletionItemKind.File;
    case 'event':
      return CompletionItemKind.Event;
    case 'component':
      return CompletionItemKind.Class;
    case 'directive':
    case ScriptElementKind.keyword:
      return CompletionItemKind.Keyword;
    default:
      return CompletionItemKind.Text;
  }
}
