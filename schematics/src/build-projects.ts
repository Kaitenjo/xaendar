import { readdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { PackageJson } from 'type-fest';
import { build } from 'vite';

const projectsPath = '../packages';

/**
 * Scans the `../packages` directory and builds a map associating each project
 * with its `@xaendar`-scoped dependencies.
 *
 * The `cli` folder is excluded from the scan.
 * If a project has no `@xaendar` dependencies, it is mapped to an empty object.
 *
 * @returns A map of `projectName → { "@xaendar/pkg": "version" }`.
 *
 * @example
 * // packages/ structure:
 * //   core/package.json  → dependencies: { "@xaendar/utils": "^1.0.0" }
 * //   ui/package.json    → dependencies: {}
 *
 * mapProjectsDependencies();
 * // Map {
 * //   "core" => { "@xaendar/utils": "^1.0.0" },
 * //   "ui"   => {}
 * // }
 */
function mapProjectsDependencies(): Map<string, Record<string, string>> {
  return new Map(
    readdirSync(projectsPath)
      .filter(folder => folder !== 'cli')
      .reduce<[string, Record<string, string>][]>((acc, value) => {
        try {
          const packageJson: PackageJson = JSON.parse(readFileSync(resolve(projectsPath, value, 'package.json'), { encoding: 'utf-8' }));
          const dependencies = packageJson.dependencies;
          if (!dependencies) {
            acc.push([value, {}])
            return acc;
          }

          const xendarDependencies = Object.entries(dependencies)
            .filter(([packageName, _version]) => packageName.includes('@xaendar'))
            .reduce<Record<string, string>>((acc, [packageName, version]) => {
              acc[packageName] = version!;
              return acc;
            }, {});

          if (xendarDependencies) {
            acc.push([value, xendarDependencies])
          }
          return acc
        } catch (error) {
          console.warn(`Error while reading package.json for project ${value}`);
          process.exit(1);
        }
      }, [])
  );
}

/**
 * Initiates the build for all projects that have no `@xaendar` dependencies,
 * i.e. projects that do not depend on any other local package and can be built immediately.
 *
 * Projects with unresolved dependencies are skipped here and will be triggered
 * recursively by {@link buildProject} once their dependencies are built.
 *
 * @param projects - The dependency map produced by {@link mapProjectsDependencies}.
 *
 * @example
 * const projects = mapProjectsDependencies();
 * buildProjects(projects); // kicks off the dependency-ordered build chain
 */
function buildProjects(projects: Map<string, Record<string, string>>): void {
  Array.from(projects.entries())
    .filter(([_projectName, dependencies]) => Object.keys(dependencies).length === 0)
    .forEach(([projectName]) => buildProject(projectName));
}

/**
 * Builds a single `@xaendar` project using Vite, then recursively triggers
 * the build of any project that was waiting on it as a dependency.
 *
 * After a successful build, the project is removed from the shared `projects` map.
 * Any other project that listed this one as a dependency has it removed from its
 * dependency record; if that record becomes empty, its build is started immediately.
 *
 * @param  projectName - The folder name of the project to build (e.g. `"core"`).
 *                               The full package name is assumed to be `@xaendar/{projectName}`.
 *
 * @remarks
 * - The build is asynchronous (Vite returns a Promise), but errors thrown synchronously
 *   are caught and logged without stopping the process.
 * - The success log (`✅`) is printed optimistically before the Promise resolves;
 *   only Promise-level errors would be unhandled.
 *
 * @example
 * buildProject('utils');
 * // ▶ Build: @xaendar/utils
 * // ✅ @xaendar/utils completed
 */
function buildProject(projectName: string): void {
  const projectPath = resolve(projectsPath, projectName);
  console.log(`\n▶ Build: @xaendar/${projectName}`);

  try {
    build({
      root: projectPath,
      configFile: resolve(projectPath, 'vite.config.ts')
    })
    .then(() => {
      console.log(`✅ @xaendar/${projectName} completato`);
      projects.delete(projectName);
      Array.from(projects.entries()).forEach(([dependentProjectName, projectDependencies]) => {
        if (`@xaendar/${projectName}` in projectDependencies) {
            delete projectDependencies[`@xaendar/${projectName}`];
            if (Object.keys(projectDependencies).length === 0) {
              buildProject(dependentProjectName);
            }
          }
        })
      }
    );
  } catch (err) {
    const error = err as Error
    console.error(`❌ @xaendar/${projectName} fallito:`, error.message);
  }
}

const projects = mapProjectsDependencies();
buildProjects(projects);