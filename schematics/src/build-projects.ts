import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, resolve } from 'node:path';
import { build as tsupBuild } from 'tsup';
import { TsConfigJson } from 'type-fest';
import { build as viteBuild } from 'vite';
import { buildExtensionProject } from './lib/build-extension.js';
import { XaendarPackageJson } from './types/xaendar-package-json.type.js';

const projectsPath = '../packages';

/**
 * Reads and parses the `package.json` of a given package folder.
 */
function getPackageJson(projectName: string): XaendarPackageJson {
  return JSON.parse(readFileSync(resolve(projectsPath, projectName, 'package.json'), { encoding: 'utf-8' }));
}

/**
 * Scans the `../packages` directory and builds a map associating each project
 * with its `@xaendar`-scoped dependencies.
 *
 * @returns A map of `projectName → { "@xaendar/pkg": "version" }`.
 */
function mapProjectsDependencies(): Map<string, Record<string, string>> {
  return new Map(
    readdirSync(projectsPath)
      .reduce<[string, Record<string, string>][]>((acc, folder) => {
        try {
          const pkg = getPackageJson(folder);
          // A peer such as @xaendar/core of a library is built first too: the library reads its declarations
          const dependencies = Object.assign({}, pkg.dependencies, pkg.peerDependencies);

          const xaendarDependencies = Object.entries(dependencies)
            .filter(([name]) => name.includes('@xaendar'))
            .reduce<Record<string, string>>((deps, [name, version]) => {
              deps[name] = version!;
              return deps;
            }, {});

          acc.push([folder, xaendarDependencies]);
          return acc;
        } catch {
          console.warn(`Error while reading package.json for project ${folder}`);
          process.exit(1);
        }
      }, [])
  );
}

/**
 * Starts the build for all projects with no pending `@xaendar` dependencies.
 */
function buildProjects(projects: Map<string, Record<string, string>>): void {
  Array.from(projects.entries())
    .filter(([, deps]) => Object.keys(deps).length === 0)
    .forEach(([name]) => buildProject(name));
}

/**
 * Builds a single package using Vite (browser) or tsup (node), based on the
 * `xaendar.target` field in its `package.json`.
 *
 * After a successful build, any dependent project that was waiting on this one
 * has the dependency removed; if the dependent has no more pending deps, its
 * build is triggered immediately.
 *
 * @param projectName - The folder name of the project (e.g. `"compiler"`).
 */
function buildProject(projectName: string): void {
  const projectPath = resolve(projectsPath, projectName);
  const pkg = getPackageJson(projectName);

  // Skip packages that are not meant to be built independently
  if (pkg.xaendar?.build === false) {
    console.log(`⏭️  Skip: @xaendar/${projectName} (bundled by consumer)`);
    markComplete(projectName);
    return;
  }

  const target = pkg.xaendar?.target ?? 'browser';

  console.log(`\n▶ Build [${pkg.xaendar?.library ? 'library' : target}]: @xaendar/${projectName}`);

  const onSuccess = () => {
    // The extension declares its engine and its license itself, for the Marketplace
    if (target !== 'extension') {
      completePublishedPackage(projectName, pkg);
    }

    console.log(`✅ @xaendar/${projectName} completato`);
    markComplete(projectName);
  };

  const onError = (err: Error) => {
    console.error(`❌ @xaendar/${projectName} fallito:`, err.message);
    // The process must end with an error, so that a script running it (such as `deploy`) does not go on
    process.exitCode = 1;
  };

  let buildPromise: Promise<void> | ReturnType<typeof viteBuild>;

  try {
    if (pkg.xaendar?.library) {
      buildLibraryProject(projectPath, pkg).then(onSuccess).catch(onError);
      return;
    }

    switch (target) {
      case 'browser':
        buildPromise = buildBrowser(projectPath);
        break;
      case 'node':
        buildPromise = buildNode(projectName, projectPath, pkg);
        break;
      case 'extension':
        buildPromise = buildExtension(projectName, projectPath, pkg);
        break;
    }

    buildPromise.then(onSuccess).catch(onError);
  } catch (err) {
    onError(err as Error);
  }
}

/**
 * Builds a browser package using Vite.
 */
function buildBrowser(projectPath: string): ReturnType<typeof viteBuild> {
  return viteBuild({
    root: projectPath,
    configFile: resolve(projectPath, 'vite.config.ts'),
  });
}

/**
 * Builds a Node package using tsup.
 *
 * - Entry point: `xaendar.entry` from package.json, defaults to `src/public-api.ts`.
 * - Output: `dist/@xaendar/{projectName}` in the workspace root.
 * - If `noExternal` is set, all dependencies are bundled inline (self-contained executable).
 * - Declaration files are emitted unless `xaendar.dts` is explicitly `false`.
 */
async function buildNode(projectName: string, projectPath: string, pkg: XaendarPackageJson): Promise<void> {
  const entry = pkg.xaendar?.entry ?? 'src/public-api.ts';
  const outDir = resolve(projectPath, '../../dist/@xaendar', projectName);
  const distDir = resolve(outDir, 'dist');
  const entryPath = resolve(projectPath, entry).replace(/\\/g, '/');

  let dts: Parameters<typeof tsupBuild>[0]['dts'] = false;
  let types: { types: string } | object = {};

  if (pkg.xaendar?.dts) {
    const mainTsConfigPath = resolve(projectsPath, '../tsconfig.json');
    const mainTsConfig: TsConfigJson = JSON.parse(readFileSync(mainTsConfigPath, 'utf-8'));

    dts = {
      compilerOptions: {
        ignoreDeprecations: '6.0',
        rootDir: resolve(projectPath, '../..'),
        paths: Object.entries(mainTsConfig.compilerOptions!.paths!).reduce<Record<string, string[]>>((acc, [key, paths]) => {
          acc[key] = paths.map(p => resolve(projectPath, '../..', `${p}.ts`).replace(/\\/g, '/'));
          return acc;
        }, {}),
        types: ['*']
      }
    };

    types = {
      types: `./dist/${projectName}.d.ts`
    };
  }

  await tsupBuild({
    entry: {
      [projectName]: entryPath
    },
    minify: true,
    outDir: distDir,
    format: ['esm'],
    dts,
    sourcemap: false,
    clean: true,
    // The optional peer dependencies (e.g. the stylesheet preprocessors) come from the project using the package
    external: Object.keys(Object.assign({}, pkg.dependencies, pkg.peerDependencies)),
    tsconfig: resolve(projectsPath, '../tsconfig.json')
  });
  return writePackageJsonForNodeProject(projectName, pkg, { types, outDir });
}

function writePackageJsonForNodeProject(projectName: string, pkg: XaendarPackageJson, options: { types: { types: string } | object, outDir: string }): void {
  const executable = pkg.xaendar?.executable === true;
  let bin: Record<string, unknown> = {};
  if (executable) {
    bin = {
      bin: {
        xd: `dist/${projectName}.js`,
      }
    }
  }

  const distPkg = {
    name: pkg.name!,
    version: pkg.version!,
    description: pkg.description ?? '',
    author: pkg.author ?? '',
    license: pkg.license ?? 'MIT',
    // npm checks the repository against the one of the workflow publishing with provenance
    repository: pkg.repository,
    type: 'module',
    ...bin,
    exports: {
      '.': {
        ...options.types,
        import: `./dist/${projectName}.js`,
        require: `./dist/${projectName}.js`
      }
    },
    main: `./dist/${projectName}.js`,
    ...options.types,
    dependencies: pkg.dependencies,
    peerDependencies: pkg.peerDependencies,
    peerDependenciesMeta: pkg.peerDependenciesMeta
  };

  mkdirSync(options.outDir, { recursive: true });

  const packageJsonPath = resolve(options.outDir, 'package.json');
  writeFileSync(packageJsonPath, JSON.stringify(distPkg, null, 2), 'utf-8');
}

/**
 * Builds a Xaendar library of components and directives with the build of the libraries of the CLI, run from its
 * sources as the documentation site runs it: a workspace of its own, created for the build and deleted afterwards,
 * declares the library, built into `dist/@xaendar/<name>` with its manifest, its declarations and its `package.json`.
 *
 * The workspace is inside the repository, so that Babel finds the plugin of the decorators in its `node_modules`.
 *
 * @param projectPath - The folder of the library.
 * @param pkg - The `package.json` of the library.
 * @returns A promise resolving once the library is built.
 * @throws If the build of the CLI fails.
 */
async function buildLibraryProject(projectPath: string, pkg: XaendarPackageJson): Promise<void> {
  const repositoryRoot = resolve(projectsPath, '..');
  const folder = basename(projectPath);
  const workspace = resolve(repositoryRoot, 'dist', `.xaendar-library-${folder}`);
  const config = { libs: { [pkg.name!]: { root: projectPath, outDir: resolve(repositoryRoot, 'dist/@xaendar', folder) } } };
  mkdirSync(workspace, { recursive: true });
  writeFileSync(resolve(workspace, 'xaendar.json'), JSON.stringify(config, null, 2), 'utf-8');
  try {
    await runCliBuild(repositoryRoot, workspace);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
}

/**
 * Runs `xd build` from the sources of the CLI, with the `paths` of the repository, in a workspace.
 *
 * @param repositoryRoot - The root of the repository.
 * @param workspace - The folder of the workspace.
 * @returns A promise resolving once the build ends.
 * @throws If the build exits with an error.
 */
function runCliBuild(repositoryRoot: string, workspace: string): Promise<void> {
  const tsx = createRequire(import.meta.url).resolve('tsx/cli');
  const args = [tsx, '--tsconfig', resolve(repositoryRoot, 'tsconfig.json'), resolve(repositoryRoot, 'packages/cli/src/index.ts'), 'build'];
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, { cwd: workspace, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolvePromise() : reject(new Error(`xd build exited with code ${code}`)));
  });
}

async function buildExtension(projectName: string, projectPath: string, pkg: XaendarPackageJson): Promise<void> {
  return buildExtensionProject({
    projectName,
    projectPath,
    pkg,
    tsconfigPath: resolve(projectsPath, '../tsconfig.json'),
    watch: false,
  });
}

/**
 * Marks a project as complete and triggers dependents whose deps are now satisfied.
 */
function markComplete(projectName: string): void {
  projects.delete(projectName);

  Array.from(projects.entries()).forEach(([dependentName, deps]) => {
    if (`@xaendar/${projectName}` in deps) {
      delete deps[`@xaendar/${projectName}`];
      if (Object.keys(deps).length === 0) {
        buildProject(dependentName);
      }
    }
  });
}

/**
 * Gives the built package what every published package carries, whichever tool built it (Vite, tsup, `xd build`):
 * the license and the author of its `package.json`, the version of Node of the root `package.json`, which the packages
 * need (the CLI, the build, the compiler, the rendering on the server), and the `LICENSE` file of the repository.
 *
 * @param projectName - The folder name of the project (e.g. `"compiler"`).
 * @param pkg - The `package.json` of the project.
 * @throws If the root `package.json` declares no version of Node, or a file cannot be read or written.
 */
function completePublishedPackage(projectName: string, pkg: XaendarPackageJson): void {
  const root: XaendarPackageJson = JSON.parse(readFileSync(resolve(projectsPath, '../package.json'), 'utf-8'));
  const node = root.engines?.node;
  if (!node) {
    throw new Error('The root package.json declares no engines.node');
  }

  const outDir = resolve(projectsPath, '../dist/@xaendar', projectName);
  const packageJsonPath = resolve(outDir, 'package.json');
  const distPkg: XaendarPackageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  distPkg.author = pkg.author;
  distPkg.license = pkg.license;
  distPkg.engines = { node };
  writeFileSync(packageJsonPath, JSON.stringify(distPkg, null, 2), 'utf-8');
  copyFileSync(resolve(projectsPath, '../LICENSE'), resolve(outDir, 'LICENSE'));
}

const projects = mapProjectsDependencies();
buildProjects(projects);
