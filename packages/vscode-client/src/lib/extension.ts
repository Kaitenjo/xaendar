import { join } from 'node:path';
import { type ExtensionContext, workspace } from 'vscode';
import { LanguageClient, type LanguageClientOptions, type ServerOptions, TransportKind } from 'vscode-languageclient/node';

/**
 * The client of the Xaendar language server, while the extension is active.
 */
let client: LanguageClient | null = null;

/**
 * Starts the Xaendar language server, as a separate process, and its client.
 *
 * The client serves the templates of the components and synchronizes with the server the TypeScript files of the
 * components, so that the templates see their unsaved changes, and watches every TypeScript file, so that the
 * templates are checked again when the classes of their components, of the components they import or of their
 * base classes change on disk.
 *
 * @param context - The context of the extension.
 */
export function activate(context: ExtensionContext): void {
  const serverModule = context.asAbsolutePath(join('server', 'server.cjs'));

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: {
        execArgv: ['--nolazy', '--inspect=6009']
      }
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { language: 'html', pattern: '**/*.xd.component.html' },
      { language: 'typescript', pattern: '**/*.xd.component.ts' }
    ],
    synchronize: {
      fileEvents: [
        workspace.createFileSystemWatcher('**/*.ts'),
        workspace.createFileSystemWatcher('**/xaendar.json'),
      ],
    },
  };

  client = new LanguageClient('xaendarLanguageServer', 'Xaendar Language Server', serverOptions, clientOptions);
  client.start();
}

/**
 * Stops the client and the language server.
 *
 * @returns A promise resolving once the client is stopped, `undefined` if it never started.
 */
export function deactivate(): Promise<void> | undefined {
  return client?.stop();
}
