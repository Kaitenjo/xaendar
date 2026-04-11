import depcheck from 'depcheck';
import fs from 'fs';
import path from 'path';
import { PackageJson } from 'type-fest';

const deepCheckOptions = {
  ignoreDirs: [
    // folder with these names will be ignored
    'resources',
    'cultures',
    'stories',
    'testing'
  ],
  ignoreMatches: [
    // ignore dependencies that matches these globs
    'json-schema'
  ],
  ignorePatterns: [
    '*.json',
    '*.spec.ts',
    '*.js',
    '*.scss'
  ],
  detectors: [
    // the target detectors
    depcheck.detector.requireCallExpression,
    depcheck.detector.importDeclaration,
  ]
};

async function execute(): Promise<void> {
  let hasError = false;
  const projectPaths = getProjectPaths();
  const mainPackageFile = getPackageJson('');
  const mainDependencies = Object.assign({}, mainPackageFile.dependencies, mainPackageFile.devDependencies);

  for (const projectPath of projectPaths) {
    const packageJson = getPackageJson(projectPath);
    const depCheckResult = await depcheck(projectPath, deepCheckOptions);
    const packagePeerDependenciesUsedNames = Object.keys(packageJson.peerDependencies ?? []);

    const errors = new Array<unknown[]>;

    const realAllInvalidFiles = Object.keys(depCheckResult.invalidFiles);
    if (realAllInvalidFiles.length) {
      errors.push(['Package', packageJson.name, 'invalid files!']);
      errors.push([depCheckResult.invalidFiles]);
      hasError = true;
    }

    // Check all dependencies not used
    const realAllDependenciesUsedNames = Object.keys(depCheckResult.using);
    const peerDependenciesUnused = packagePeerDependenciesUsedNames.filter(item => realAllDependenciesUsedNames.indexOf(item) < 0);
    if (peerDependenciesUnused.length) {
      errors.push(['Package', packageJson.name, 'imports unused libraries!']);
      errors.push(['Please remove following peerDependencies']);
      errors.push([peerDependenciesUnused.join('\r\n')]);
      hasError = true;
    }

    // Check all self ref dependencies on code
    const selfDepOnSourceCode = realAllDependenciesUsedNames.findIndex(d => d === packageJson.name);
    if (selfDepOnSourceCode > -1) {
      errors.push(['package', packageJson.name, 'has a self dep, remove it']);
      hasError = true;
    }

    // Check all self ref dependencies on packages
    const selfDepOnPackage = Object.keys(packagePeerDependenciesUsedNames).findIndex(d => d === packageJson.name);
    if (selfDepOnPackage > -1) {
      errors.push(['package', packageJson.name, 'has a self dep, remove it']);
      hasError = true;
    }

    // Check all missing dependencies
    const dependenciesMissing = Object.keys(depCheckResult.missing).filter(d => d !== packageJson.name).sort();
    if (dependenciesMissing.length) {
      const dependenciesToAdd = dependenciesMissing.map((dependencyMissing, i) => `${i !== 0 ? '\r\n' : ''}- '${dependencyMissing}': '${dependencyMissing.startsWith('@xendar') ? packageJson.version : mainDependencies[dependencyMissing]}'`);
      errors.push(['Package', packageJson.name, 'miss libraries!']);
      errors.push(['Please add following peerDependencies']);
      errors.push([dependenciesToAdd.join('')]);
      hasError = true;
    }

    if (errors.length) {
      console.log(`----------------------${packageJson.name}----------------------\n`);
      errors.forEach(error => console.error(...error));
      console.log();
    }
  }

  if (hasError) {
    console.error('Error on dependencies check!!!');
    process.exit(1);
  } else {
    console.log('Nothing to report, all packages dependencies are correct.');
  }
}

/**
 * Gets the paths of all projects in the packages folder, excluding those in EXCLUDES
 * @returns An array of project paths
 */
function getProjectPaths(): string[] {
  const packagesDir = path.resolve('..', 'packages');
  return fs.readdirSync(packagesDir).map(project => path.join(packagesDir, project));
}

/**
 * Reads and parses the package.json file of a project
 * @param projectPath Path to the project
 * @returns The parsed package.json content
 */
function getPackageJson(projectPath: string): PackageJson {
  const packageJsonPath = path.join(projectPath, 'package.json');
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
}

execute();