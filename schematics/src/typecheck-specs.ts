import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

/**
 * The root of the repository.
 */
const repositoryRoot = resolve(import.meta.dirname, '../..');

/**
 * The entry point of the TypeScript compiler of the repository.
 */
const tscPath = createRequire(import.meta.url).resolve('typescript/bin/tsc');

/**
 * The output of the type-check of a project.
 */
type TypecheckResult = {
  /**
   * The name of the project.
   */
  name: string;
  /**
   * The errors printed by `tsc`, empty when the project type-checks.
   */
  output: string;
  /**
   * Whether `tsc` exited with errors.
   */
  failed: boolean;
};

/**
 * Type-checks a project with `tsc --noEmit`, collecting what it prints.
 *
 * @param name - The name of the project, printed with its result.
 * @param tsconfigPath - The path of the `tsconfig` of the project.
 * @returns The result of the type-check.
 */
function typecheck(name: string, tsconfigPath: string): Promise<TypecheckResult> {
  return new Promise(resolvePromise => {
    const child = spawn(process.execPath, [tscPath, '--noEmit', '--project', tsconfigPath], { cwd: dirname(tsconfigPath) });
    let output = '';
    child.stdout.on('data', chunk => output += chunk);
    child.stderr.on('data', chunk => output += chunk);
    child.on('close', code => resolvePromise({ name, output, failed: code !== 0 }));
  });
}

/**
 * Type-checks the specs of every package under `packages`, with the `tsconfig.spec.json` of the package, and the ones
 * of the documentation site in `src/docs`, with its `tsconfig.json`. Vitest strips the types of the specs without
 * checking them: the tests run after this check, which exits with code `1` when a project has errors.
 */
async function typecheckSpecs(): Promise<void> {
  const packagesRoot = resolve(repositoryRoot, 'packages');
  const projects = readdirSync(packagesRoot).map(name => ({ name: `@xaendar/${name}`, tsconfigPath: resolve(packagesRoot, name, 'tsconfig.spec.json') }));
  projects.push({ name: 'docs', tsconfigPath: resolve(repositoryRoot, 'src/docs/tsconfig.json') });

  const missing = projects.filter(({ tsconfigPath }) => !existsSync(tsconfigPath));
  if (missing.length) {
    for (let i = 0; i < missing.length; i++) {
      console.error(`❌  ${missing[i].name}: no ${missing[i].tsconfigPath}`);
    }

    process.exit(1);
  }

  const results = await Promise.all(projects.map(({ name, tsconfigPath }) => typecheck(name, tsconfigPath)));
  const failures = results.filter(({ failed }) => failed);
  for (let i = 0; i < failures.length; i++) {
    const { name, output } = failures[i];
    console.error(`❌ Type errors in the specs of ${name}:\n${output}`);
  }

  if (failures.length) {
    process.exit(1);
  }

  console.log(`✅ Specs type-checked: ${results.map(({ name }) => name).join(', ')}`);
}

typecheckSpecs();
