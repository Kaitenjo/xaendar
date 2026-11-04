import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Folder holding the built VS Code extension. This script runs from the `schematics` directory.
 */
const EXTENSION_FOLDER = '../dist/@xaendar/vscode-client';

/**
 * Publishes the built VS Code extension to the Marketplace with `vsce publish`.
 *
 * The Personal Access Token is read from the `VSCE_PAT` environment variable (scope Marketplace > Manage, all
 * accessible organizations): `vsce` picks it up on its own, so it never appears on the command line.
 * Run `npm run build:projects` first: the extension is published as it is in `dist`.
 * With `--check` it only verifies the token, to fail early before a release.
 *
 * Exits the process with code `1` if the extension is not built, the token is missing or the publication fails.
 */
function publishExtension(): void {
  const extensionPath = resolve(EXTENSION_FOLDER);

  if (!process.env['VSCE_PAT']) {
    console.error('❌ VSCE_PAT is not set. Set it to your Marketplace Personal Access Token:');
    console.error('   $env:VSCE_PAT = "<token>"');
    process.exit(1);
  }

  if (process.argv.includes('--check')) {
    console.log('✅ VSCE_PAT is set');
    return;
  }

  if (!existsSync(resolve(extensionPath, 'package.json'))) {
    console.error('❌ Extension not built. Please run:');
    console.error('   npm run build:projects');
    process.exit(1);
  }

  console.log('🚀 Publishing the VS Code extension...');

  try {
    execSync('npx --yes @vscode/vsce publish --no-dependencies', { stdio: 'inherit', cwd: extensionPath });
    console.log('✅ VS Code extension published successfully');
  } catch (err) {
    const error = err as Error;
    console.error('❌ Failed to publish the VS Code extension:', error.message);
    process.exit(1);
  }
}

publishExtension();
