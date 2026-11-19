import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Base path to the distribution folder containing all scoped packages.
 * This script runs from the `schematics` directory, so we go up one level
 * to reach the monorepo root, then into `dist/@xaendar`.
 */
const DIST_FOLDER = '../dist/@xaendar';

/**
 * Projects found in {@link DIST_FOLDER} that are not published to npm: the VS Code extension goes to the Marketplace
 * (`vsce publish`).
 */
const EXCLUDED_PROJECTS = ['vscode-client'];

/**
 * Tells whether the packages are published by a GitHub Actions workflow through trusted publishing: npm exchanges the
 * OIDC token of the job (`id-token: write`, which sets `ACTIONS_ID_TOKEN_REQUEST_URL`) for a short-lived token at
 * `npm publish`, so there is no login to check and no npm token at all.
 *
 * @returns `true` when the job can request an OIDC token.
 */
function isTrustedPublishing(): boolean {
  return Boolean(process.env['GITHUB_ACTIONS'] && process.env['ACTIONS_ID_TOKEN_REQUEST_URL']);
}

/**
 * Verifies that the current environment is authenticated with npm.
 *
 * Runs `npm whoami` to check for a valid session or token; a workflow publishing through trusted publishing has none
 * to check (see {@link isTrustedPublishing}).
 * Exits the process with code `1` if authentication fails.
 *
 * @example
 * checkAuth(); // logs "Logged in as: yourname" or exits with an error
 */
function checkAuth(): void {
  if (isTrustedPublishing()) {
    console.log('✅ Trusted publishing: npm authenticates the workflow through OIDC');
    return;
  }

  try {
    const user = execSync('npm whoami', { stdio: 'pipe' }).toString().trim();
    console.log(`✅ Logged in as: ${user}`);
  } catch {
    console.error('❌ You are not logged in to npm. Please run:');
    console.error('   npm login');
    console.error('   or set NPM_TOKEN in your environment');
    process.exit(1);
  }
}

/**
 * Tells whether the version of a built package is already on the registry, published by an earlier run of a release
 * that stopped at a later step: `npm view <name>@<version> version` prints the version when it exists, nothing when it
 * does not (a package never published fails, which counts as not published).
 *
 * @param projectPath - The folder of the built package, holding its `package.json`.
 * @returns The name and version of the package, and whether that version is published.
 */
function readPublication(projectPath: string): { name: string, version: string, published: boolean } {
  const { name, version } = JSON.parse(readFileSync(resolve(projectPath, 'package.json'), { encoding: 'utf-8' })) as { name: string, version: string };
  try {
    return { name, version, published: execSync(`npm view ${name}@${version} version`, { stdio: 'pipe' }).toString().trim() === version };
  } catch {
    return { name, version, published: false };
  }
}

/**
 * Publishes all packages found in {@link DIST_FOLDER} to the npm registry.
 *
 * Iterates over every subdirectory of the dist folder, treating each as a
 * scoped `@xaendar/*` package, and runs `npm publish --access public` inside it.
 * A package whose version is already on the registry is skipped, so a release stopped at a later step can run again
 * (`npm run deploy -- --bump=none`) without failing here.
 *
 * Exits the process with code `1` if any package fails to publish.
 *
 * @returns A promise that resolves when all packages have been published successfully.
 *
 * @example
 * await publishAll();
 * // Publishes @xaendar/core, @xaendar/utils, etc.
 */
async function publishAll(): Promise<void> {
  const packages = readdirSync(DIST_FOLDER).filter(project => !EXCLUDED_PROJECTS.includes(project));
  console.log(`\n📦 Publishing ${packages.length} @xaendar package(s)...\n`);

  for (let i = 0; i < packages.length; i++) {
    const project = packages[i];
    const projectPath = resolve(DIST_FOLDER, project);
    const { name, version, published } = readPublication(projectPath);
    if (published) {
      console.log(`⏭️  ${name}@${version} is already published\n`);
      continue;
    }

    console.log(`🚀 Publishing @xaendar/${project}...`);

    try {
      execSync('npm publish --access public', { stdio: 'inherit', cwd: projectPath });
      console.log(`✅ @xaendar/${project} published successfully\n`);
    } catch (err) {
      const error = err as Error;
      console.error(`❌ Failed to publish @xaendar/${project}:`, error.message);
      process.exit(1);
    }
  }

  console.log('🎉 All packages published successfully!');
}

checkAuth();
publishAll();