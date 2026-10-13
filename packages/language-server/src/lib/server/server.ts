import { TextDocument } from 'vscode-languageserver-textdocument';
import { createConnection, ProposedFeatures, TextDocuments } from 'vscode-languageserver/node';
import { XaendarLanguageServer } from '../server-handlers/server-handlers';

/**
 * Entry point of the Xaendar language server, launched by the VS Code extension as a separate process.
 */
new XaendarLanguageServer(createConnection(ProposedFeatures.all), new TextDocuments(TextDocument)).listen();
