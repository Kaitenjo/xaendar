import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import type { DeferNode } from '../../parser/types/nodes/defer-node.type';
import type { HydrateNode } from '../../parser/types/nodes/hydrate-node.type';
import type { ComponentMetadata } from '../../types/component-metadata.type';
import type { ComponentOrDirectiveMetadata } from '../../types/component-or-directive-metadata.type';
import type { ContextCache } from '../../types/context-cache.type';
import type { ElementNamespace } from '../../types/element-namespace.type';

/**
 * Tracks identifier scope during render code generation.
 * Each `Context` instance represents one lexical scope (e.g. a `@for` loop body)
 * and can be chained to a parent context for outer-scope resolution.
 */
export class GeneratorContext extends CompilerContext {
  /**
   * The compiler cache associated with this context, used to store and retrieve
   * intermediate compilation results for efficiency.
   */
  public cache: ContextCache;
  /**
   * The modules each `@hydrate` and `@defer` of the template loads before its content is rendered: the ones of the
   * components its content alone renders, which the module of the template does not import (see `getDeferredModules`).
   */
  public deferredModules?: ReadonlyMap<HydrateNode | DeferNode, readonly string[]>;
  /**
   * Parent context representing the enclosing scope.
   */
  protected declare parent: GeneratorContext | undefined;
  /**
   * The components the template renders that render only in the browser, by tag name (see {@link getClientComponent}).
   */
  private readonly _clientComponents = new Map<string, ComponentMetadata>();
  /**
   * The components and the directives the template imports, by tag name and by `@@selector` (see
   * {@link getImportedMetadata}).
   */
  private readonly _importedMetadata = new Map<string, ComponentOrDirectiveMetadata>();
  /**
   * The tag names of the interactive components a static template renders, which hydrate by themselves (see
   * {@link isIsland}).
   */
  private readonly _islands = new Set<string>();
  /**
   * The events the template listens to, held by the root scope (see {@link addEventName}).
   */
  private readonly _eventNames = new Set<string>();

  /**
   * The events the template listens to, read from the root scope.
   *
   * @returns The names of the events.
   */
  public get eventNames(): ReadonlySet<string> {
    return this._eventNames;
  }

  /**
   * Creates a new scope context.
   *
   * @param parentContext - Parent context representing the enclosing scope.
   * @param namespace - The namespace the elements declared in this scope are created in, when it differs from the one of
   *   the enclosing scope, i.e. for the children of an `<svg>`, a `<math>` or a `<foreignObject>` element.
   */
  constructor(parentContext: GeneratorContext, namespace?: ElementNamespace);
  /**
   * Creates a new root scope context.
   *
   * @param cache - Cache object to prevent recalculation when not needed
   * @param namespace - The namespace the elements declared in this scope are created in, when it differs from the one of
   *   the enclosing scope, i.e. for the children of an `<svg>`, a `<math>` or a `<foreignObject>` element.
   */
  constructor(cache: ContextCache, namespace?: ElementNamespace);
  constructor(parentContextOrCache: GeneratorContext | ContextCache, namespace?: ElementNamespace) {
    if (parentContextOrCache instanceof GeneratorContext) {
      super(parentContextOrCache, namespace);
      this.cache = parentContextOrCache.cache;
      this.deferredModules = parentContextOrCache.deferredModules;
    } else {
      super(undefined, namespace);
      this.cache = parentContextOrCache;
    }
  }

  /**
   * Registers a tag name of an interactive component the template renders, the template being a static one.
   *
   * @param tagName - The tag name.
   */
  public addIsland(tagName: string): void {
    this._islands.add(tagName);
  }

  /**
   * Registers an event the template listens to, in the root scope, which holds the ones of the whole template.
   *
   * @param name - The name of the event.
   */
  public addEventName(name: string): void {
    this.parent?.addEventName(name) ?? this._eventNames.add(name);
  }

  /**
   * Registers a component the template renders that renders only in the browser.
   *
   * @param component - The metadata of the component.
   */
  public addClientComponent(component: ComponentMetadata): void {
    this._clientComponents.set(component.selector, component);
  }

  /**
   * Registers a component or a directive the template imports.
   *
   * @param metadata - The metadata of the component or of the directive.
   */
  public addImportedMetadata(metadata: ComponentOrDirectiveMetadata): void {
    this._importedMetadata.set(metadata.type === 'directive' ? `@@${metadata.selector}` : metadata.selector, metadata);
  }

  /**
   * Tells whether a tag name is the one of an interactive component a static template renders, registered in this scope
   * or any of its ancestor scopes: it hydrates by itself, from the inputs written on its element.
   *
   * @param tagName - The tag name to check.
   * @returns `true` if the component hydrates by itself, `false` otherwise.
   */
  public isIsland(tagName: string): boolean {
    return this._islands.has(tagName) || (this.parent?.isIsland(tagName) ?? false);
  }

  /**
   * Returns the component rendering only in the browser a tag name is the one of, registered in this scope or any of its
   * ancestor scopes.
   *
   * @param tagName - The tag name to check.
   * @returns The metadata of the component, `undefined` when the tag name is not the one of such a component.
   */
  public getClientComponent(tagName: string): ComponentMetadata | undefined {
    return this._clientComponents.get(tagName) ?? this.parent?.getClientComponent(tagName);
  }

  /**
   * Returns the metadata of a component or of a directive the template imports, registered in this scope or any of its
   * ancestor scopes.
   *
   * @param key - The tag name of the component, or the selector of the directive as applied in templates (`@@selector`).
   * @returns The metadata, `undefined` when the template imports no such component or directive.
   */
  public getImportedMetadata(key: string): ComponentOrDirectiveMetadata | undefined {
    return this._importedMetadata.get(key) ?? this.parent?.getImportedMetadata(key);
  }
}
