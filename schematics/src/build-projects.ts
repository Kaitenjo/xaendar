import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { PackageJson } from 'type-fest';
import { build as viteBuild } from 'vite';
import { build as tsupBuild } from 'tsup';

const projectsPath = '../packages';

type XaendarTarget = 'browser' | 'node';

type XaendarPackageJson = PackageJson & {
  /**
   * Custom field used to configure the build process for each package. It specifies
   */
  xaendar?: {
    /**
     * The intended runtime environment for the package, which determines the build tool and output format. Defaults to `browser`.
     */
    target: XaendarTarget;
    /** 
     * Entry point relative to the package root. Defaults to `src/public-api.ts`. 
     */
    entry?: string;
    /** 
     * Whether to emit `.d.ts` declaration files. Defaults to `true`. 
     */
    dts?: boolean;
  };
};

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
          const dependencies = pkg.dependencies ?? {};

          const xendarDependencies = Object.entries(dependencies)
            .filter(([name]) => name.includes('@xaendar'))
            .reduce<Record<string, string>>((deps, [name, version]) => {
              deps[name] = version!;
              return deps;
            }, {});

          acc.push([folder, xendarDependencies]);
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
  const target = pkg.xaendar?.target ?? 'browser';

  console.log(`\n▶ Build [${target}]: @xaendar/${projectName}`);

  const onSuccess = () => {
    console.log(`✅ @xaendar/${projectName} completato`);
    projects.delete(projectName);

    Array.from(projects.entries()).forEach(([dependentName, deps]) => {
      if (`@xaendar/${projectName}` in deps) {
        delete deps[`@xaendar/${projectName}`];
        if (Object.keys(deps).length === 0) {
          buildProject(dependentName);
        }
      }
    });
  };

  const onError = (err: unknown) => {
    console.error(`❌ @xaendar/${projectName} fallito:`, (err as Error).message);
  };

  try {
    target === 'node'
     ? buildNode(projectName, projectPath, pkg).then(onSuccess).catch(onError)
     : buildBrowser(projectPath).then(onSuccess).catch(onError);
  } catch (err) {
    onError(err);
  }
}

/**
 * Builds a browser package using Vite.
 */
function buildBrowser(projectPath: string): Promise<unknown> {
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
 * - All `dependencies` are externalized (not bundled).
 * - Declaration files are emitted unless `xaendar.dts` is explicitly `false`.
 */
function buildNode(projectName: string, projectPath: string, pkg: XaendarPackageJson): Promise<unknown> {
  const entry = pkg.xaendar?.entry ?? 'src/public-api.ts';
  const dts = pkg.xaendar?.dts !== false;
  const outDir = resolve(projectPath, '../../dist/@xaendar', projectName);
  const external = Object.keys(pkg.dependencies ?? {});

  return tsupBuild({
    entry: [resolve(projectPath, entry)],
    outDir,
    format: ['esm'],
    dts,
    external,
    sourcemap: true,
    clean: true,
  });
}

const projects = mapProjectsDependencies();
buildProjects(projects);
