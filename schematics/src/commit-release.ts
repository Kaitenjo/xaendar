import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { PackageJson } from 'type-fest';

/**
 * Path of the root `package.json`, whose version names the release. This script runs from the `schematics` directory.
 */
const ROOT_PACKAGE_JSON = '../package.json';

/**
 * Reads the version of the root `package.json`.
 *
 * @returns The version of the release, e.g. `'1.3.7'`.
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
 * Commits the changes of the release, `Release <version>`, and pushes the commit to the branch it was made on.
 *
 * The commit holds the tracked files the release changed: the versions written by `update-version` (packages, plugin,
 * catalog), the lockfile updated by the install of the published versions, and the fixes of `check-dependencies`;
 * new files, such as the tarballs of `pack-projects`, stay out. It runs before `tag-release`, so the tag names the
 * commit holding the version it names. The identity of the commit is the one git is configured with: the release
 * workflow sets the owner's (see the Commits section of `CLAUDE.md`).
 *
 * Does nothing when nothing changed, as in a release run again without a bump (`--bump=none`). Exits the process
 * with code `1` if the commit or the push fails.
 *
 * @example
 * commitRelease(); // commits and pushes "Release 1.3.7"
 */
function commitRelease(): void {
  const message = `Release ${readVersion()}`;

  // A release run again without a bump (--bump=none) finds its commit already made
  if (!execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { encoding: 'utf-8' }).trim()) {
    console.log(`⏭️  Nothing to commit for ${message}: the commit of the release is already made`);
    return;
  }

  console.log(`📝 Committing and pushing "${message}"...`);

  try {
    execFileSync('git', ['commit', '--all', '--message', message], { stdio: 'inherit' });
    execFileSync('git', ['push', 'origin', 'HEAD'], { stdio: 'inherit' });
    console.log(`✅ ${message} pushed successfully`);
  } catch (err) {
    const error = err as Error;
    console.error(`❌ Failed to commit or push ${message}:`, error.message);
    process.exit(1);
  }
}

commitRelease();
