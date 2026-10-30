import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PackageJson } from 'type-fest';
import ts from 'typescript';
import { PluginOption, UserConfig } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * Options used to extend the shared Vite config.
 */
export type ViteConfigOptions = {
  plugins?: PluginOption[],
  secondaryEntryPoints?: Record<string, string>,
  /**
   * Removes the `declare global` blocks from the declaration files: for a package whose sources declare the globals of another
   * package only to be type-checked, while its users get them from that package.
   */
  removeGlobalDeclarations?: boolean,
}

/**
 * Builds the standard Vite configuration for Xaendar packages.
 *
 * @param name Package name (for example, `@xaendar/core`).
 * @param dirName Absolute path of the package directory.
 * @param options Optional build extensions (plugins and secondary entry points).
 * @returns A reusable Vite user configuration.
 */
export default function getViteConfig(name: string, dirName: string, options?: ViteConfigOptions): UserConfig {
  const fileName = JSON.parse(JSON.stringify(name.split('/').join('-').slice(1)));
  const outDir = resolve(dirName, `../../dist/${name}`);
  const distDir = join(outDir, 'dist');
  const secondaryEntryPoints = options?.secondaryEntryPoints ?? {};
  const entry: Record<string, string> = { [fileName]: resolve(dirName, 'src/public-api.ts') };
  for (const [entryPoint, path] of Object.entries(secondaryEntryPoints)) {
    entry[entryPoint] = resolve(dirName, path);
  }

  const plugins: PluginOption[] = [
    createGeneratePackageJsonPlugin(dirName, fileName, outDir, secondaryEntryPoints),
    createCopyReadmePlugin(dirName, outDir),
    dts({
      exclude: [`**/packages/${fileName.split('-')[1]}/**/*.spec.ts`],
      include: [
        `**/packages/${fileName.split('-')[1]}/**/*.ts`,
        '**/packages/signals/**/global.d.ts'
      ],
      bundleTypes: true,
      outDirs: distDir,
      root: resolve(dirName, 'src'),
      afterBuild() {
        const pkgImportRegex = /from (['"])(?:\.\.\/)*([^/'"]+)\/src\/public-api\1/g;
        const dts = readdirSync(distDir, { recursive: true, encoding: 'utf-8' }).filter(entry => entry.endsWith('.d.ts')).map((entry) => join(distDir, entry));
        for (const filePath of dts) {
          const content = readFileSync(filePath, 'utf-8');
          const result = content.replace(pkgImportRegex, (_match, quote, pkg) => `from ${quote}@xaendar/${pkg}${quote}`);

          console.log(result === content, filePath);
          if (result !== content) {
            writeFileSync(filePath, result);
          }
        }

        for (const entryPoint of Object.keys(secondaryEntryPoints)) {
          importFromSecondaryEntryPoint(join(distDir, `${fileName}.d.ts`), join(distDir, `${entryPoint}.d.ts`), `${name}/${entryPoint}`);
        }

        if (options?.removeGlobalDeclarations) {
          for (const filePath of dts) {
            removeGlobalDeclarations(filePath);
          }
        }
      }
    })
  ];
  if (options?.plugins?.length) {
    plugins.push(...options.plugins);
  }

  return {
    build: {
      target: 'esnext',
      lib: {
        entry,
        name,
        fileName: (_, entryName) => `${entryName}.js`,
        formats: ['es']
      },
      outDir: distDir,
      emptyOutDir: true,
      rollupOptions: {
        external: [
          '@xaendar/common',
          '@xaendar/compiler',
          '@xaendar/core',
          '@xaendar/core/signals',
          '@xaendar/signals',
          '@xaendar/types',
          'typescript'
        ]
      },
      minify: false,
      sourcemap: false
    },
    logLevel: 'info',
    plugins
  };
}

/**
 * Creates the plugin that writes the distribution `package.json`.
 *
 * @param dirName Absolute path of the current package directory.
 * @param fileName Output file name derived from the package name.
 * @param outDir Output root directory for the package.
 * @param secondaryEntryPoints Additional export entry points.
 * @returns A Vite plugin that generates `package.json` in the output folder.
 */
function createGeneratePackageJsonPlugin(dirName: string, fileName: string, outDir: string, secondaryEntryPoints: Record<string, string>): PluginOption {
  return {
    name: 'generate-package-json',
    writeBundle() {
      const pkgPath = resolve(dirName, 'package.json');
      const pkg: PackageJson = JSON.parse(readFileSync(pkgPath, 'utf-8'));

      const exports: PackageJson.ExportConditions = {
        '.': {
          import: {
            types: `./dist/${fileName}.d.ts`,
            default: `./dist/${fileName}.js`
          }
        }
      };
      for (const entryPoint of Object.keys(secondaryEntryPoints)) {
        exports[`./${entryPoint}`] = {
          import: {
            types: `./dist/${entryPoint}.d.ts`,
            default: `./dist/${entryPoint}.js`
          }
        };
      }

      const distPkg: Record<string, unknown> = {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        sideEffects: false,
        type: 'module',
        main: `./dist/${fileName}.js`,
        module: `./dist/${fileName}.js`,
        types: `./dist/${fileName}.d.ts`,
        exports
      };

      const { peerDependencies, dependencies } = pkg;
      if (peerDependencies && Object.keys(peerDependencies).length) {
        distPkg.peerDependencies = peerDependencies;
      }

      if (dependencies && Object.keys(dependencies).length) {
        distPkg.dependencies = dependencies;
      }

      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, 'package.json'), JSON.stringify(distPkg, null, 2));
    }
  };
}

/**
 * Creates the plugin that copies package `README.md` to the output folder.
 *
 * @param dirName Absolute path of the current package directory.
 * @param outDir Output root directory for the package.
 * @returns A Vite plugin that copies `README.md` if present.
 */
function createCopyReadmePlugin(dirName: string, outDir: string): PluginOption {
  return {
    name: 'copy-readme',
    writeBundle() {
      const readmePath = resolve(dirName, 'README.md');
      if (existsSync(readmePath)) {
        copyFileSync(readmePath, resolve(outDir, 'README.md'));
      }
    }
  };
}

/**
 * A top-level declaration of a declaration file, as compared between two of them.
 */
type Declaration = {
  /**
   * The name of the declaration.
   */
  name: string,
  /**
   * Whether the declaration is exported.
   */
  exported: boolean,
  /**
   * The text of the declaration, without its JSDoc and without its `export` modifier.
   */
  text: string,
  /**
   * The statement declaring it.
   */
  statement: ts.Statement
};

/**
 * Replaces, in the declaration file of the main entry point, the copies of the declarations exported by the declaration file
 * of a secondary entry point with an import from the secondary entry point.
 *
 * The declaration files are bundled one per entry point, and each one inlines its own copy of the declarations it uses: a copy
 * of a nominal type, such as one keyed by a `unique symbol`, is a type of its own, so a value typed through the secondary entry
 * point would not match the same type used by the main one. Only the declarations the main file does not export and whose text is
 * identical to the one exported by the secondary file are replaced.
 *
 * @param mainPath Path of the declaration file of the main entry point.
 * @param secondaryPath Path of the declaration file of the secondary entry point.
 * @param specifier The module specifier of the secondary entry point (for example, `@xaendar/core/signals`).
 */
function importFromSecondaryEntryPoint(mainPath: string, secondaryPath: string, specifier: string): void {
  const content = readFileSync(mainPath, 'utf-8');
  const main = readDeclarations(mainPath, content);
  const secondary = new Map<string, Declaration>();
  const secondaryDeclarations = readDeclarations(secondaryPath, readFileSync(secondaryPath, 'utf-8'));
  for (let i = 0; i < secondaryDeclarations.length; i++) {
    const declaration = secondaryDeclarations[i];
    if (declaration.exported) {
      secondary.set(declaration.name, declaration);
    }
  }

  const copies = main.filter(declaration => !declaration.exported && secondary.get(declaration.name)?.text === declaration.text);
  if (!copies.length) {
    return;
  }

  // Removed from the last one, so that the positions of the previous ones stay valid
  let result = content;
  for (let i = copies.length - 1; i >= 0; i--) {
    const { statement } = copies[i];
    result = result.slice(0, statement.getFullStart()) + result.slice(statement.getEnd());
  }

  const names = copies.map(declaration => declaration.name).join(', ');
  writeFileSync(mainPath, removeUnreferencedDeclarations(mainPath, `import { ${names} } from '${specifier}';\n${result}`));
}

/**
 * Removes the declarations a declaration file does not export and does not reference any more, such as the ones only the copies
 * replaced by `importFromSecondaryEntryPoint` used: the bundler writes only the declarations an entry point reaches, so one left
 * without references belonged to a removed copy. Repeated until none is left, since removing one can leave another without references.
 *
 * @param path Path of the declaration file.
 * @param content Content of the declaration file.
 * @returns The content without the declarations no longer referenced.
 */
function removeUnreferencedDeclarations(path: string, content: string): string {
  let result = content;
  let unreferenced: Declaration[];
  do {
    const source = ts.createSourceFile(path, result, ts.ScriptTarget.Latest, true);
    const references = countReferences(source);
    unreferenced = readDeclarations(path, result).filter(declaration => !declaration.exported && !references.get(declaration.name));
    // Removed from the last one, so that the positions of the previous ones stay valid
    for (let i = unreferenced.length - 1; i >= 0; i--) {
      const { statement } = unreferenced[i];
      result = result.slice(0, statement.getFullStart()) + result.slice(statement.getEnd());
    }
  } while (unreferenced.length);

  return result;
}

/**
 * Counts the identifiers of a declaration file by name, leaving out the names of the top-level declarations themselves.
 *
 * @param source The declaration file.
 * @returns The number of references to each name.
 */
function countReferences(source: ts.SourceFile): Map<string, number> {
  const declarationNames = new Set<ts.Node>();
  for (let i = 0; i < source.statements.length; i++) {
    const name = nameNodeOf(source.statements[i]);
    if (name) {
      declarationNames.add(name);
    }
  }

  const references = new Map<string, number>();
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && !declarationNames.has(node)) {
      references.set(node.text, (references.get(node.text) ?? 0) + 1);
    }

    ts.forEachChild(node, visit);
  };
  ts.forEachChild(source, visit);
  return references;
}

/**
 * Reads the named top-level declarations of a declaration file.
 *
 * @param path Path of the declaration file.
 * @param content Content of the declaration file.
 * @returns The declarations, in the order they are written.
 */
function readDeclarations(path: string, content: string): Declaration[] {
  const source = ts.createSourceFile(path, content, ts.ScriptTarget.Latest, true);
  const declarations = new Array<Declaration>();
  for (let i = 0; i < source.statements.length; i++) {
    const statement = source.statements[i];
    const name = nameOf(statement);
    if (name) {
      const exported = ts.canHaveModifiers(statement) && !!ts.getModifiers(statement)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword);
      declarations.push({ name, exported, text: statement.getText(source).replace(/^export /, ''), statement });
    }
  }

  return declarations;
}

/**
 * Reads the name of a top-level declaration.
 *
 * @param statement The statement declaring it.
 * @returns The name, or `undefined` for a statement declaring no single name (imports, `declare global`, re-exports).
 */
function nameOf(statement: ts.Statement): string | undefined {
  return nameNodeOf(statement)?.text;
}

/**
 * Reads the identifier naming a top-level declaration.
 *
 * @param statement The statement declaring it.
 * @returns The identifier, or `undefined` for a statement declaring no single name (imports, `declare global`, re-exports).
 */
function nameNodeOf(statement: ts.Statement): ts.Identifier | undefined {
  if (ts.isVariableStatement(statement)) {
    const { declarations } = statement.declarationList;
    return declarations.length === 1 && ts.isIdentifier(declarations[0].name) ? declarations[0].name : undefined;
  }

  const isNamed = ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement) || ts.isClassDeclaration(statement)
    || ts.isFunctionDeclaration(statement) || ts.isEnumDeclaration(statement);
  return isNamed ? statement.name : undefined;
}

/**
 * Removes the `declare global` blocks from a declaration file.
 *
 * @param filePath Path of the declaration file.
 */
function removeGlobalDeclarations(filePath: string): void {
  const content = readFileSync(filePath, 'utf-8');
  const source = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
  const blocks = source.statements.filter(statement => ts.isModuleDeclaration(statement) && (statement.flags & ts.NodeFlags.GlobalAugmentation) !== 0);
  if (!blocks.length) {
    return;
  }

  // Removed from the last one, so that the positions of the previous ones stay valid
  let result = content;
  for (let i = blocks.length - 1; i >= 0; i--) {
    result = result.slice(0, blocks[i].getFullStart()) + result.slice(blocks[i].getEnd());
  }

  writeFileSync(filePath, result);
}
