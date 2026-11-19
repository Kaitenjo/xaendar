import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Folder holding the built VS Code extension. This script runs from the `schematics` directory.
 */
const EXTENSION_FOLDER = '../dist/@xaendar/vscode-client';

/**
 * Tells whether the extension is published by a GitHub Actions workflow through the Trusted Publishing of the
 * Marketplace: `vsce publish --oidc` exchanges the OIDC token of the job (`id-token: write`, which sets
 * `ACTIONS_ID_TOKEN_REQUEST_URL`) for a Marketplace credential, granted by the policy of the publisher
 * (marketplace.visualstudio.com/manage → publisher → Trusted Publishing), so no Personal Access Token is needed.
 *
 * @returns `true` when the job can request an OIDC token.
 */
function isTrustedPublishing(): boolean {
  return Boolean(process.env['GITHUB_ACTIONS'] && process.env['ACTIONS_ID_TOKEN_REQUEST_URL']);
}

/**
 * Publishes the built VS Code extension to the Marketplace with `vsce publish`.
 *
 * In the release workflow it authenticates through Trusted Publishing (see {@link isTrustedPublishing}). Elsewhere
 * the Personal Access Token is read from the `VSCE_PAT` environment variable (scope Marketplace > Manage): `vsce` picks
 * it up on its own, so it never appears on the command line.
 * Run `npm run build:projects` first: the extension is published as it is in `dist`.
 * With `--check` it only verifies the authentication, to fail early before a release.
 *
 * Exits the process with code `1` if the extension is not built, the token is missing or the publication fails.
 */
function publishExtension(): void {
  const extensionPath = resolve(EXTENSION_FOLDER);
  const trusted = isTrustedPublishing();

  if (!trusted && !process.env['VSCE_PAT']) {
    console.error('❌ VSCE_PAT is not set. Set it to your Marketplace Personal Access Token:');
    console.error('   PowerShell: $env:VSCE_PAT = "<token>"   bash: export VSCE_PAT="<token>"');
    console.error('   GitHub Actions: Trusted Publishing, the job needing `id-token: write`');
    process.exit(1);
  }

  if (process.argv.includes('--check')) {
    console.log(trusted ? '✅ Trusted Publishing: the Marketplace authenticates the workflow through OIDC' : '✅ VSCE_PAT is set');
    return;
  }

  if (!existsSync(resolve(extensionPath, 'package.json'))) {
    console.error('❌ Extension not built. Please run:');
    console.error('   npm run build:projects');
    process.exit(1);
  }

  console.log('🚀 Publishing the VS Code extension...');

  try {
    execSync(`npx --yes @vscode/vsce publish --no-dependencies${trusted ? ' --oidc' : ''}`, { stdio: 'inherit', cwd: extensionPath });
    console.log('✅ VS Code extension published successfully');
  } catch (err) {
    const error = err as Error;
    console.error('❌ Failed to publish the VS Code extension:', error.message);
    process.exit(1);
  }
}

publishExtension();
