import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { PackageJson } from 'type-fest';

/**
 * Path of the root `package.json`, whose version names the tag. This script runs from the `schematics` directory.
 */
const ROOT_PACKAGE_JSON = '../package.json';

/**
 * Reads the version of the root `package.json`.
 *
 * @returns The version of the release, e.g. `'1.3.2'`.
 *
 * @throws Will throw if the `package.json` cannot be read or has no `version`.
 */
function readVersion(): string {
  const packageJson: PackageJson = JSON.parse(readFileSync(ROOT_PACKAGE_JSON, { encoding: 'utf-8' }));

  if (!packageJson.version) {
    throw new Error(`${ROOT_PACKAGE_JSON} has no version`);
  }

  return packageJson.version;
}

/**
 * Tells whether a tag already exists in the local repository.
 *
 * @param tag - The name of the tag.
 *
 * @returns `true` if the tag exists.
 */
function tagExists(tag: string): boolean {
  return execFileSync('git', ['tag', '--list', tag], { encoding: 'utf-8' }).trim() === tag;
}

/**
 * Creates the tag `xaendar--v<version>` on the current commit and pushes it to `origin`.
 *
 * The version is the one of the root `package.json`. Exits the process with code `1` if the tag already exists
 * or if the creation or the push fails.
 *
 * @example
 * tagRelease(); // creates and pushes xaendar--v1.3.2
 */
function tagRelease(): void {
  const tag = `xaendar--v${readVersion()}`;

  if (tagExists(tag)) {
    console.error(`❌ The tag ${tag} already exists`);
    process.exit(1);
  }

  console.log(`🏷️  Creating and pushing the tag ${tag}...`);

  try {
    execFileSync('git', ['tag', tag], { stdio: 'inherit' });
    execFileSync('git', ['push', 'origin', tag], { stdio: 'inherit' });
    console.log(`✅ Tag ${tag} pushed successfully`);
  } catch (err) {
    const error = err as Error;
    console.error(`❌ Failed to create or push the tag ${tag}:`, error.message);
    process.exit(1);
  }
}

tagRelease();
