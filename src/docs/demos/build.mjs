import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
  Builds the demo applications embedded in the "Integrations" page. Each one is a standalone project with its
  own toolchain: this script only installs and builds them, in order, and checks the result.

  The shared component library is built first, because every application depends on it through a file: link.

  Their output is not committed, so a fresh clone has to build them before the documentation shows them. The
  `--check` mode exists for that: the `prestart` and `prebuild` of the site run it, and it only reports what
  is missing, without ever stopping the command the reader actually asked for.

  Usage: node src/docs/demos/build.mjs [--check] [...names]   (all of them when no name is given)
*/

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(ROOT, '..', 'public', 'demos');
const LIBRARY = 'qty-picker';
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/**
 * Runs a command line in a folder, and stops the script when it fails. The command goes through a shell, since
 * `npm` is a `.cmd` on Windows, and as one string, since arguments passed beside a shell are deprecated.
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

/**
 * Installs the dependencies of a project, when they are not installed yet, and builds it.
 *
 * @param name - The name of the folder under `demos`.
 */
function build(name) {
  const folder = join(ROOT, name);
  console.log(`\n=== ${name} ===`);
  if (!existsSync(join(folder, 'node_modules'))) {
    run(`${NPM} install`, folder);
  }

  run(`${NPM} run build`, folder);
}

const argv = process.argv.slice(2);
const checkOnly = argv.includes('--check');
const asked = argv.filter(argument => argument !== '--check');
const all = readdirSync(ROOT, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(join(ROOT, entry.name, 'package.json')))
  .map(entry => entry.name);
const names = asked.length ? asked : all;
const apps = names.filter(name => name !== LIBRARY);

if (checkOnly) {
  const missing = apps.filter(name => !existsSync(join(OUTPUT, name, 'index.html')));
  if (missing.length) {
    console.warn(`\nThe demo applications of the Integrations page are not built: ${missing.join(', ')}.`);
    console.warn('Their frames will be empty until you run "npm run build:demos" in src/docs.\n');
  }

  process.exit(0);
}

if (names.includes(LIBRARY) || !asked.length) {
  build(LIBRARY);
}

for (let i = 0; i < apps.length; i++) {
  build(apps[i]);
}

if (apps.length) {
  console.log('\n=== verify ===');
  run(`"${process.execPath}" "${join(ROOT, 'verify.mjs')}" ${apps.join(' ')}`, ROOT);
}
