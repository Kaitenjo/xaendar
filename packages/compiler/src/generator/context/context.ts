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
   * The constants of the module listing the variables of the template a binding reads (see {@link getReads}), by the
   * names they list, joined: held by the root scope.
   */
  private readonly _reads = new Map<string, string>();
  /**
   * The declarations of the constants of the module (see {@link declareConstant}), in the order they are declared: held
   * by the root scope.
   */
  private readonly _constants = new Array<string>();
  /**
   * The declarations of the functions of the module computing the expressions of the template (see
   * {@link declareFunction}), in the order they are declared: held by the root scope.
   */
  private readonly _functions = new Array<string>();
  /**
   * The names of the constants and of the functions declared, which no other declaration takes: held by the root scope.
   */
  private readonly _moduleNames = new Set<string>();

  /**
   * The events the template listens to, read from the root scope.
   *
   * @returns The names of the events.
   */
  public get eventNames(): ReadonlySet<string> {
    return this._eventNames;
  }

  /**
   * The declarations of the constants listing the variables the bindings read (see {@link getReads}), read from the root
   * scope, to write at the top of the module.
   *
   * @returns The declarations, one per list, e.g. `const _reads0 = ['row'];`.
   */
  public get readsDeclarations(): string[] {
    const declarations = new Array<string>();
    for (const [names, constant] of this._reads) {
      declarations.push(`const ${constant} = [${names.split(',').map(name => `'${name}'`).join(', ')}];`);
    }

    return declarations;
  }

  /**
   * The declarations of the constants of the module (see {@link declareConstant}), read from the root scope, to write
   * before the functions, once the ones of `readsDeclarations`, which they read.
   *
   * @returns The declarations, in the order they were declared.
   */
  public get constantDeclarations(): readonly string[] {
    return this._constants;
  }

  /**
   * The declarations of the functions of the module computing the expressions of the template (see
   * {@link declareFunction}), read from the root scope, to write after the functions rendering the blocks.
   *
   * @returns The declarations, in the order they were declared.
   */
  public get functionDeclarations(): readonly string[] {
    return this._functions;
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
   * Returns the constant of the module listing the variables of the template a binding reads, which the runtime receives
   * to run the binding again when one of them changes (see `_bindEffect` of the runtime): one per list, held by the root
   * scope and declared at the top of the module (see {@link readsDeclarations}), so that the bindings of a template,
   * however many times it renders, share it.
   *
   * N.B. Deliberate, to save memory: a constant of the module instead of an array literal written in the render code,
   * which would allocate an array per binding at each render, in every row of a table. Do not inline it.
   *
   * @param variables - The names of the variables the binding reads, if any.
   * @returns The name of the constant, `undefined` when the binding reads no variable.
   */
  public getReads(variables: readonly string[] | undefined): string | undefined {
    if (!variables?.length) {
      return undefined;
    }

    if (this.parent) {
      return this.parent.getReads(variables);
    }

    const key = variables.slice().sort().join(',');
    let constant = this._reads.get(key);
    if (!constant) {
      constant = `_reads${this._reads.size}`;
      this._reads.set(key, constant);
    }

    return constant;
  }

  /**
   * Declares a constant of the module, held by the root scope and written before the functions (see
   * {@link constantDeclarations}): the configuration of an element or of a block, the variables of a `@for`, a template,
   * which the runtime receives at every render of the template and only reads.
   *
   * N.B. Deliberate, to save memory: what does not change from an instance of the template to another is declared once in
   * the module, instead of an array or an object literal written in the render code, which would allocate it at each
   * render, in every row of a table. Do not inline it.
   *
   * @param name - The name of the constant, derived from the one of the element or of the block it describes, followed by
   *   `$` and its role (`td0$element`, `div0__if0$if`): a name already declared gets a number after it.
   * @param value - The code of its value, the first line on the line of its name.
   * @returns The name the constant is declared with.
   */
  public declareConstant(name: string, value: string): string {
    if (this.parent) {
      return this.parent.declareConstant(name, value);
    }

    const unique = this._uniqueName(name);
    this._constants.push(`const ${unique} = ${value};`);
    return unique;
  }

  /**
   * Declares a function of the module computing an expression of the template, held by the root scope and written after
   * the functions rendering the blocks (see {@link functionDeclarations}): the runtime calls it with the component as
   * `this` and the parameters it lists, the context first, so it reads nothing else.
   *
   * N.B. Deliberate, to save memory: an expression is a function declared once in the module, instead of an arrow
   * function written in the render code, which would create a closure at each render, in every row of a table. Do not
   * write expressions as closures.
   *
   * @param name - The name of the function, derived from the one of the element or of the block holding the expression,
   *   followed by `$` and its role (`tr0$class`, `table0__for0$track`): a name already declared gets a number after it.
   * @param parameters - The parameters of the function (`context`, `context, $event`).
   * @param body - The lines of its body.
   * @returns The name the function is declared with.
   */
  public declareFunction(name: string, parameters: string, body: readonly string[]): string {
    if (this.parent) {
      return this.parent.declareFunction(name, parameters, body);
    }

    const unique = this._uniqueName(name);
    const lines = [`function ${unique}(${parameters}) {`];
    for (let i = 0; i < body.length; i++) {
      lines.push(`  ${body[i]}`);
    }

    lines.push('}');
    this._functions.push(lines.join('\n'));
    return unique;
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

  /**
   * Returns a name of the module no declaration takes yet, and takes it: the name given, or, when it is taken, the name
   * followed by the first number not taken (`td0$on_click1`). A name declared is the one of an element or of a block,
   * ending with its index, then `$` and a role: the names of the module the generator writes otherwise (the functions
   * rendering the blocks, `render`, `_reads0`) never take that form.
   *
   * @param name - The name wanted.
   * @returns The name to declare.
   */
  private _uniqueName(name: string): string {
    let unique = name;
    for (let i = 1; this._moduleNames.has(unique); i++) {
      unique = `${name}${i}`;
    }

    this._moduleNames.add(unique);
    return unique;
  }
}
