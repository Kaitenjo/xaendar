import { removeDocumentOverlay, setDocumentOverlay } from '@xaendar/language-core';
import { DiagnosticCategory, ScriptElementKind } from 'typescript';
import { describe, expect, it } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { CompletionItemKind, DiagnosticSeverity } from 'vscode-languageserver/node';
import { URI } from 'vscode-uri';
import { fromUri, getDocument, toCompletionItemKind, toRange, toSeverity, toUri } from './lsp.utils';

describe('fromUri / toUri', () => {
  it('converts between file URIs and paths', () => {
    const fileName = URI.file('/src/app.ts').fsPath;

    expect(toUri(fileName)).toBe('file:///src/app.ts');
    expect(fromUri('file:///src/app.ts')).toBe(fileName);
  });
});

describe('toRange', () => {
  it('converts a span into the range of the document', () => {
    const document = TextDocument.create('file:///a.html', 'html', 1, 'ab\ncd');

    expect(toRange(document, { start: 1, end: 4 })).toEqual({ start: { line: 0, character: 1 }, end: { line: 1, character: 1 } });
  });
});

describe('getDocument', () => {
  it('returns the document open in the editor', () => {
    const open = TextDocument.create(toUri('/src/open.ts'), 'typescript', 3, 'open');

    expect(getDocument('/src/open.ts', uri => uri === open.uri ? open : undefined)).toBe(open);
  });

  it('returns a document with the text of the file otherwise, empty for a file that cannot be read', () => {
    setDocumentOverlay('/src/closed.ts', 'text');

    expect(getDocument('/src/closed.ts', () => undefined).getText()).toBe('text');
    expect(getDocument('/src/missing-file.ts', () => undefined).getText()).toBe('');

    removeDocumentOverlay('/src/closed.ts');
  });
});

describe('toSeverity', () => {
  it.each([
    [DiagnosticCategory.Error, DiagnosticSeverity.Error],
    [DiagnosticCategory.Warning, DiagnosticSeverity.Warning],
    [DiagnosticCategory.Suggestion, DiagnosticSeverity.Hint],
    [DiagnosticCategory.Message, DiagnosticSeverity.Information]
  ])('maps the category %s to the severity %s', (category, severity) => {
    expect(toSeverity(category)).toBe(severity);
  });
});

describe('toCompletionItemKind', () => {
  it.each([
    [ScriptElementKind.memberVariableElement, CompletionItemKind.Field],
    [ScriptElementKind.memberGetAccessorElement, CompletionItemKind.Field],
    [ScriptElementKind.memberSetAccessorElement, CompletionItemKind.Field],
    [ScriptElementKind.memberFunctionElement, CompletionItemKind.Method],
    [ScriptElementKind.functionElement, CompletionItemKind.Function],
    [ScriptElementKind.variableElement, CompletionItemKind.Variable],
    [ScriptElementKind.letElement, CompletionItemKind.Variable],
    [ScriptElementKind.constElement, CompletionItemKind.Variable],
    [ScriptElementKind.classElement, CompletionItemKind.Class],
    [ScriptElementKind.directory, CompletionItemKind.Folder],
    [ScriptElementKind.scriptElement, CompletionItemKind.File],
    ['event', CompletionItemKind.Event],
    ['component', CompletionItemKind.Class],
    ['directive', CompletionItemKind.Keyword],
    [ScriptElementKind.keyword, CompletionItemKind.Keyword],
    [ScriptElementKind.interfaceElement, CompletionItemKind.Text]
  ])('maps the kind %s to the completion kind %s', (kind, completionKind) => {
    expect(toCompletionItemKind(kind)).toBe(completionKind);
  });
});
