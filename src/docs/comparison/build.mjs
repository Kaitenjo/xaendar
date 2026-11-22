import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
  Builds the three pages of the framework comparison, measured and linked by the "Framework comparison" page of the
  documentation. Each one is a standalone project with its own toolchain: this script only installs and builds
  them, in order.

  Their output is not committed, so a fresh clone has to build them before the documentation can link them. The
  `--check` mode exists for that: the `prestart`, `prebuild` and `preprerender` of the site run it, and it only
  reports what is missing, without ever stopping the command the reader actually asked for.

  Usage: node src/docs/comparison/build.mjs [--check] [...names]   (all of them when no name is given)
*/

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(ROOT, '..', 'public', 'comparison');
const APPS = ['angular', 'react', 'xaendar'];
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/**
 * Runs a command line in a folder, and stops the script when it fails.
 *
 * @param command - The command line to run.
 * @param cwd - The folder to run it in.
 */
function run(command, cwd) {
  const result = spawnSync(command, { cwd, stdio: 'inherit', shell: true });
  if (result.status !== 0) {
    console.error(`\n${command} failed in ${cwd}`);
    process.exit(result.status ?? 1);
  }
}

const argv = process.argv.slice(2);
const checkOnly = argv.includes('--check');
const asked = argv.filter(argument => argument !== '--check');
const names = asked.length ? asked : APPS;

if (checkOnly) {
  const missing = names.filter(name => !existsSync(join(OUTPUT, name, 'index.html')));
  if (missing.length) {
    console.warn(`\nThe pages of the framework comparison are not built: ${missing.join(', ')}.`);
    console.warn('The documentation links them, but they are missing until you run "npm run build:comparison" in src/docs.\n');
  }

  process.exit(0);
}

for (let i = 0; i < names.length; i++) {
  const folder = join(ROOT, names[i]);
  console.log(`\n=== ${names[i]} ===`);
  if (!existsSync(join(folder, 'node_modules'))) {
    run(`${NPM} install`, folder);
  }

  run(`${NPM} run build`, folder);
}
