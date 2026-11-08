import { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import type { ComponentEventMetadata } from '../../types/component-event-metadata.type';
import type { ComponentOrDirectiveMetadata } from '../../types/component-or-directive-metadata.type';
import type { LibraryComponentMetadata } from '../../types/library-component-metadata.type';
import type { LibraryDirectiveMetadata } from '../../types/library-directive-metadata.type';
import type { LibraryManifest } from '../../types/library-manifest/library-manifest.type';
import type { LibraryManifestBinding } from '../../types/library-manifest/library-manifest-binding.type';
import type { LibraryManifestDeclaration } from '../../types/library-manifest/library-manifest-declaration.type';
import type { LibraryManifestInput } from '../../types/library-manifest/library-manifest-input.type';
import type { TypeReference } from '../../types/type-reference.type';

/**
 * The `import()` types of the types the compiler writes for the bindings, their module between single quotes, and the
 * name they reference after it, if any.
 */
const IMPORT_TYPE = /import\('([^']*)'\)(?:\.([A-Za-z_$][\w$]*))?/g;

/**
 * Rewrites the modules the `import()` types of a type reference: the compiler references the classes of the components
 * and the types of their bindings through the absolute paths of the files declaring them, which the manifest of a
 * library writes relative to the root of its package, and an application reading it as absolute paths again.
 *
 * @example
 * mapTypeModules("ReturnType<import('/lib/src/card').Card['label']>", module => module.replace('/lib/src', '.'));
 * // "ReturnType<import('./card').Card['label']>"
 *
 * @param type - The type.
 * @param map - Rewrites a module, as written between the quotes.
 * @returns The type, its modules rewritten.
 */
export function mapTypeModules(type: string, map: (module: string) => string): string {
  return type.replace(IMPORT_TYPE, (_match, module: string, name: string | undefined) => `import('${map(module)}')${name === undefined ? '' : `.${name}`}`);
}

/**
 * Lists the names the `import()` types of a type reference in their modules (`import('/lib/src/card').Card` → the name
 * `Card` of the module `/lib/src/card`), which the module must export for a type written in another file to read them.
 *
 * @param type - The type.
 * @returns The modules and the names, `undefined` when the type references none.
 */
export function listTypeReferences(type: string): TypeReference[] | undefined {
  let references: TypeReference[] | undefined;
  const importType = new RegExp(IMPORT_TYPE);
  let match: RegExpExecArray | null;
  while ((match = importType.exec(type)) !== null) {
    if (match[2] !== undefined) {
      references ??= new Array<TypeReference>();
      references.push({ module: match[1], name: match[2] });
    }
  }

  return references;
}

/**
 * Describes a component or a directive of a library for its manifest: its selector, its inputs and events with their
 * types, the modules of the library they reference rewritten by `mapModule`, the module an application imports to define
 * it, and its declarations.
 *
 * @param metadata - The metadata of the component or of the directive, extracted from the sources of the library.
 * @param module - The path of the `exports` of the package leading to the module declaring it.
 * @param types - The declarations of the module, relative to the root of the package.
 * @param mapModule - Rewrites a module the types reference (see {@link mapTypeModules}).
 * @returns The description.
 */
export function toLibraryDeclaration(metadata: ComponentOrDirectiveMetadata, module: string, types: string, mapModule: (module: string) => string): LibraryManifestDeclaration {
  const { type, className, selector, typeParameters } = metadata;
  const declaration: LibraryManifestDeclaration = { type, className, selector, module, types, inputs: toInputs(metadata, mapModule), events: toEvents(metadata, mapModule) };
  if (typeParameters?.length) {
    declaration.typeParameters = typeParameters;
  }

  if (metadata.type === 'component' && metadata.clientOnly) {
    declaration.ssr = { render: false };
    if (metadata.clientOnly.hydrate !== undefined) {
      declaration.ssr.hydrate = metadata.clientOnly.hydrate;
    }
  }

  return declaration;
}

/**
 * Describes the inputs of a component or of a directive for the manifest of its library.
 *
 * @param metadata - The metadata of the component or of the directive.
 * @param mapModule - Rewrites a module the types reference.
 * @returns The inputs, by the name a template binds them with.
 */
function toInputs({ properties }: ComponentOrDirectiveMetadata, mapModule: (module: string) => string): LibraryManifestInput[] {
  const inputs = new Array<LibraryManifestInput>();
  for (const [name, property] of properties) {
    const input: LibraryManifestInput = { name, type: mapTypeModules(property.type, mapModule) };
    if (property.name !== name) {
      input.property = property.name;
    }

    if (property.required) {
      input.required = true;
    }

    if (property.exposed) {
      input.exposed = true;
    }

    inputs.push(input);
  }

  return inputs;
}

/**
 * Describes the events of a component or of a directive for the manifest of its library.
 *
 * @param metadata - The metadata of the component or of the directive.
 * @param mapModule - Rewrites a module the types reference.
 * @returns The events, by name.
 */
function toEvents({ events }: ComponentOrDirectiveMetadata, mapModule: (module: string) => string): LibraryManifestBinding[] {
  const bindings = new Array<LibraryManifestBinding>();
  for (const [name, event] of events) {
    bindings.push({ name, type: mapTypeModules(event.type, mapModule) });
  }

  return bindings;
}

/**
 * Reads the metadata of a component or of a directive of a compiled library from the manifest of its package, the
 * inverse of {@link toLibraryDeclaration}: the modules of the package its types reference become absolute paths, as the
 * type-check of a template reads them, the module the generated code imports is the path of the `exports` of the package
 * leading to it, and every component of a package without the code of the server renders only in the browser.
 *
 * @param declaration - The component or the directive, as the manifest describes it.
 * @param manifest - The manifest of its package.
 * @param root - The absolute path of the root of the package, with forward slashes.
 * @returns The metadata.
 */
export function toLibraryMetadata(declaration: LibraryManifestDeclaration, manifest: LibraryManifest, root: string): LibraryComponentMetadata | LibraryDirectiveMetadata {
  const { type, className, selector, module, types, typeParameters, inputs, events, ssr } = declaration;
  const metadata: LibraryComponentMetadata | LibraryDirectiveMetadata = {
    type,
    className,
    selector,
    modulePath: toPackagePath(types, root),
    importPath: `${manifest.name}${module.slice(1)}`,
    library: { name: manifest.name, root, ssr: manifest.ssr },
    properties: toPropertiesMetadata(inputs, root),
    events: toEventsMetadata(events, root)
  };
  if (typeParameters?.length) {
    metadata.typeParameters = typeParameters;
  }

  if (type === 'component' && (ssr || !manifest.ssr)) {
    metadata.clientOnly = {};
    if (ssr?.hydrate !== undefined) {
      metadata.clientOnly.hydrate = ssr.hydrate;
    }
  }

  return metadata;
}

/**
 * Reads the properties of a component or of a directive of a compiled library from its inputs in the manifest, keyed by
 * the name a template binds them with.
 *
 * @param inputs - The inputs.
 * @param root - The absolute path of the root of the package.
 * @returns The properties.
 */
function toPropertiesMetadata(inputs: readonly LibraryManifestInput[], root: string): Map<string, ComponentPropertyMetadata> {
  const properties = new Map<string, ComponentPropertyMetadata>();
  for (let i = 0; i < inputs.length; i++) {
    const { name, property, type, required, exposed } = inputs[i];
    properties.set(name, new ComponentPropertyMetadata(property ?? name, mapTypeModules(type, module => toPackagePath(module, root)), {
      required: required === true,
      alias: property === undefined ? undefined : name,
      exposed: exposed === true
    }));
  }

  return properties;
}

/**
 * Reads the events of a component or of a directive of a compiled library from the manifest.
 *
 * @param events - The events, as the manifest describes them.
 * @param root - The absolute path of the root of the package.
 * @returns The events, by name.
 */
function toEventsMetadata(events: readonly LibraryManifestBinding[], root: string): Map<string, ComponentEventMetadata> {
  const metadata = new Map<string, ComponentEventMetadata>();
  for (let i = 0; i < events.length; i++) {
    metadata.set(events[i].name, { type: mapTypeModules(events[i].type, module => toPackagePath(module, root)) });
  }

  return metadata;
}

/**
 * Writes a path of the manifest of a package as an absolute path: the manifest writes the files of the package relative
 * to its root (`./card/card.xd.component`), and the other packages by their name, kept as they are.
 *
 * @param path - The path.
 * @param root - The absolute path of the root of the package.
 * @returns The path, absolute when it is a file of the package.
 */
function toPackagePath(path: string, root: string): string {
  return path.startsWith('./') ? `${root}${path.slice(1)}` : path;
}
