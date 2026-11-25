import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import type { DeployStep } from './types/deploy-step.type.js';

/**
 * Directory of the compiled schematics (`schematics/dist`), the one of this script.
 */
const SCHEMATICS_DIST = import.meta.dirname;

/**
 * Directory of the `schematics` project, where the schematics run, as `npm run … --prefix schematics` ran them.
 */
const SCHEMATICS_DIR = resolve(SCHEMATICS_DIST, '..');

/**
 * Root of the repository, where the tests and the final install run.
 */
const REPOSITORY_ROOT = resolve(SCHEMATICS_DIR, '..');

/**
 * Accepted values of `--bump`, passed to `update-version`.
 */
const BUMPS = ['patch', 'minor', 'major', 'none'];

/**
 * Reads the part of the version to increase from `--bump=patch|minor|major|none` (`npm run deploy -- --bump=minor`),
 * `patch` by default as the release always did. `none` releases the version already in the `package.json` files, to
 * finish a release stopped halfway: the steps skip what is already done (published packages, extension, commit, tag).
 *
 * @returns The value of `--bump` for `update-version`.
 */
function readBump(): string {
  const arg = process.argv.find(argument => argument.startsWith('--bump='));
  const bump = arg ? arg.slice('--bump='.length) : 'patch';
  if (!BUMPS.includes(bump)) {
    console.error(`❌ Invalid bump value: '${bump}'\n   Accepted values: ${BUMPS.join(', ')}`);
    process.exit(1);
  }

  return bump;
}

/**
 * Creates the step running a compiled schematic.
 *
 * @param label - What the step does.
 * @param script - The name of the schematic, without extension.
 * @param args - The arguments of the schematic.
 * @returns The step.
 */
function schematic(label: string, script: string, args: string[] = []): DeployStep {
  return { label, command: 'node', args: [resolve(SCHEMATICS_DIST, `${script}.js`), ...args], cwd: SCHEMATICS_DIR };
}

/**
 * Lists the steps of the release, in the order they run: every check comes before the first change (the version), so
 * a release failing a check changes nothing; the commit of the release comes after the install updating the lockfile
 * and after the packages are built and packed, so a build failing leaves no commit, and the tag after the commit, so it
 * names the commit holding its version. The packages and the extension are published last: a version on npm always has
 * its commit and its tag, and a publication failing is finished with `none`, which skips the commit and the tag made.
 *
 * With `none` the version is not updated and the published versions are not installed again: the release finishes one
 * stopped halfway, whose commit is already made, and the later steps skip what is already done.
 *
 * @param bump - The part of the version to increase, or `none`.
 * @returns The steps.
 */
function listSteps(bump: string): DeployStep[] {
  const checks: DeployStep[] = [
    schematic('Check the token of the VS Code extension', 'publish-extension', ['--check']),
    schematic('Check the dependencies of the packages', 'check-dependencies'),
    schematic('Type-check the specs', 'typecheck-specs'),
    { label: 'Run the tests', command: 'node', args: [resolve(REPOSITORY_ROOT, 'node_modules/vitest/vitest.mjs'), 'run'], cwd: REPOSITORY_ROOT },
    schematic('Type-check the packages', 'typecheck-projects')
  ];
  const release: DeployStep[] = [
    schematic('Build the packages', 'build-projects'),
    schematic('Pack the packages', 'pack-projects'),
    schematic('Commit and push the release', 'commit-release'),
    schematic('Tag the release', 'tag-release'),
    schematic('Publish the packages', 'publish'),
    schematic('Publish the VS Code extension', 'publish-extension')
  ];

  return bump === 'none'
    ? checks.concat(release)
    : checks.concat(
      schematic('Update the version', 'update-version', [`--bump=${bump}`]),
      // The root depends on no package of the repository: the install only writes the new version into the lockfile
      { label: 'Update the lockfile', command: 'npm', args: ['i'], cwd: REPOSITORY_ROOT },
      release
    );
}

/**
 * Runs a step, its output going to the terminal, and stops the release when it fails.
 *
 * @param step - The step.
 * @param index - The position of the step, from 0.
 * @param count - The number of steps.
 */
function runStep(step: DeployStep, index: number, count: number): void {
  console.log(`\n▶ [${index + 1}/${count}] ${step.label}\n`);
  const executable = step.command === 'node' ? process.execPath : 'npm';
  // npm is a script (npm.cmd) on Windows, which only a shell runs
  const result = spawnSync(executable, step.args, { cwd: step.cwd, stdio: 'inherit', shell: step.command === 'npm' && process.platform === 'win32' });
  if (result.status !== 0) {
    const reason = result.error ? result.error.message : result.signal ? `signal ${result.signal}` : `exit code ${result.status}`;
    console.error(`\n❌ Release stopped at "${step.label}" (${reason})`);
    process.exit(result.status || 1);
  }
}

/**
 * Releases the packages, the VS Code extension and the tag of the version, step after step (see `listSteps`). The
 * schematics are compiled first by the `deploy` script of the root `package.json`, which runs this one.
 */
function deploy(): void {
  const steps = listSteps(readBump());
  for (let i = 0; i < steps.length; i++) {
    runStep(steps[i], i, steps.length);
  }

  console.log('\n✅ Release completed');
}

deploy();
