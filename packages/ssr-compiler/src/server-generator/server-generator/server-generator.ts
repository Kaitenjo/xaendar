import { indent } from '@xaendar/common';
import { assertImportableSymbol, ASTNodeType, createContext, GeneratorContext, declareScope, declareTemplateParameters, formatErrorWithPrefix, getRuntimeAlias, getTextSeparators, ROOT_NODE, toRuntimeImport, type ASTNode, type ComponentOrDirectiveMetadata, type ContextCache, type ElementNamespace, type GeneratorFunctionToProcess, type SymbolImport, type TemplateNode } from '@xaendar/compiler';
import { generateServerClient } from '../states/generate-server-client/generate-server-client.state';
import { generateServerTry } from '../states/generate-server-try/generate-server-try.state';
import { generateServerDefer } from '../states/generate-server-defer/generate-server-defer.state';
import { generateServerElement } from '../states/generate-server-element/generate-server-element.state';
import { generateServerFor } from '../states/generate-server-for/generate-server-for.state';
import { generateServerHydrate } from '../states/generate-server-hydrate/generate-server-hydrate.state';
import { generateServerIf } from '../states/generate-server-if/generate-server-if.state';
import { generateServerLet } from '../states/generate-server-let/generate-server-let.state';
import { generateServerRender } from '../states/generate-server-render/generate-server-render.state';
import { generateServerSwitch } from '../states/generate-server-switch/generate-server-switch.state';
import { generateServerText } from '../states/generate-server-text/generate-server-text.state';
import type { ServerCodePiece } from '../types/server-code-piece.type';
import type { ServerFunctionToProcess } from '../types/server-function-to-process.type';
import type { ServerParent } from '../types/server-parent.type';
import type { ServerTransitionFunction } from '../types/server-transition-function.type';
import type { GenerateChildren } from '../types/generate-children.type';
import type { ServerTransitionResult } from '../types/server-transition-result.type';
import { SERVER_RESOLVE_OPTIONS, toStatements } from '../utils/server-code/server-code.utils';
import { isClientComponent } from '../utils/client-component/client-component.utils';
import { SSR_MARKERS } from '../../costants/ssr-markers.constants';

/**
 * The runtime helpers the code rendering on the server calls, imported by the module of every template.
 */
const RUNTIME_IMPORTS: readonly string[] = [
  'import { _Context, _iterationVariables, _let, _parameter, _setExpressionClass, _setExpressionInput, _setExpressionProperty, _setInput, _setProperty } from \'@xaendar/core\';',
  'import { _escapeAttribute, _escapeRawText, _escapeText, _ssrClientComponent, _ssrComponent, _ssrIsland, _ssrItemMarker, _ssrItems, _ssrRenderTemplate, _ssrStartTag, _ssrStructural, _ssrTemplate, _ssrTry } from \'@xaendar/ssr\';'
];

/**
 * The marker separating a text from what precedes it, which the parser would join into one text node.
 */
const TEXT_MARKER = `<!--${SSR_MARKERS.text}-->`;

/**
 * Generates, from the AST of a template, the code rendering it to HTML on the server: module-level functions writing
 * the HTML into an output, the entry point being `render(out)`, each one expecting to be invoked with the component
 * bound as `this`.
 *
 * The code follows the structure of the code of the client: the same runtime contexts, so that the expressions read the
 * names the same way, and the same functions for the blocks, the bodies of the `@for` and the content of the templates,
 * with the same names. It reads the signals once and writes no node: there is no effect, no listener and no custom
 * directive on the server.
 *
 * The dynamic parts of the HTML are marked by the comments the browser adopts their nodes by (see `SSR_MARKERS`): the
 * blocks of the control flows, the items of a `@for`, the elements structural directives are applied to, and the texts.
 * The content of a `@client` is not generated: only its markers and its `@placeholder`, if any, are written, as for a
 * `@defer`.
 * No listener is bound, but the events of the template are written as `render.events`, for the event contract of the page.
 * A `<!---->` separates the texts the parser would join into one text node, where `getTextSeparators` of the compiler
 * says, which the client generator reads too.
 */
export class ServerGenerator {
  /**
   * The functions written after `render`, by name: the ones the states return, added while they are written.
   */
  private readonly _functions = new Map<string, ServerFunctionToProcess>();
  /**
   * The state generating the code of each type of node.
   */
  private readonly _states: Readonly<Partial<Record<ASTNodeType, ServerTransitionFunction<never>>>> = {
    [ASTNodeType.Text]: generateServerText,
    [ASTNodeType.Interpolation]: generateServerText,
    [ASTNodeType.Element]: generateServerElement,
    [ASTNodeType.If]: generateServerIf,
    [ASTNodeType.For]: generateServerFor,
    [ASTNodeType.Switch]: generateServerSwitch,
    [ASTNodeType.Hydrate]: generateServerHydrate,
    [ASTNodeType.Client]: generateServerClient,
    [ASTNodeType.Try]: generateServerTry,
    [ASTNodeType.Defer]: generateServerDefer,
    [ASTNodeType.Import]: skipNode,
    // A template is declared at the start of its scope, its content is rendered by each @render calling it
    [ASTNodeType.Template]: skipNode,
    [ASTNodeType.Render]: generateServerRender,
    [ASTNodeType.Let]: generateServerLet
  };
  /**
   * Generates the code of the children of an element in the function being written, as the states call it.
   */
  private readonly _generateChildren: GenerateChildren = (nodes, parent, generatorContext) => this._generateNodes(nodes, parent, generatorContext);

  /**
   * Creates a generator for the AST of a template.
   *
   * @param _input - The source of the template, quoted by the errors.
   * @param _ast - The AST of the template.
   * @param _cache - The cache of the metadata, held by the root generator context.
   */
  constructor(
    private readonly _input: string,
    private readonly _ast: ASTNode[],
    private readonly _cache: ContextCache
  ) { }

  /**
   * Generates the code rendering the template on the server.
   *
   * @param signals - The signal members of the component.
   * @param shadowingMembers - The members of the component named like a global identifier, read from the component.
   * @param customElements - The patterns of the tag names of the custom elements of other libraries, written like native elements.
   * @param symbols - The symbols the template imports from modules: the expressions read them through the declarations
   *   importing them, written after the imports of the runtime helpers, only for the ones an expression reads.
   * @param islands - The tag names of the interactive components a static template renders, if any.
   * @param imports - The components and the directives the template imports, if any: their inputs are set by the name of
   *   their property, and the components among them rendering only in the browser are written from their metadata.
   * @returns The code: the import declarations, then the functions, `render` first.
   * @throws A `TemplateError` pointing to the part of the template the code cannot be generated for.
   */
  public generate(signals: readonly string[], shadowingMembers: readonly string[] = [], customElements: readonly string[] = [], symbols: readonly SymbolImport[] = [], islands?: ReadonlySet<string>, imports?: readonly ComponentOrDirectiveMetadata[]): string {
    try {
      this._functions.clear();
      const generatorContext = new GeneratorContext(this._cache);
      for (let i = 0; i < signals.length; i++) {
        generatorContext.addSignalClassField(signals[i]);
      }

      for (let i = 0; i < shadowingMembers.length; i++) {
        generatorContext.addShadowingMember(shadowingMembers[i]);
      }

      if (customElements.length) {
        generatorContext.addCustomElementPatterns(...customElements);
      }

      if (islands?.size) {
        for (const island of islands) {
          generatorContext.addIsland(island);
        }
      }

      if (imports?.length) {
        for (let i = 0; i < imports.length; i++) {
          const metadata = imports[i];
          generatorContext.addImportedMetadata(metadata);
          if (isClientComponent(metadata)) {
            generatorContext.addClientComponent(metadata);
          }
        }
      }


      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        assertImportableSymbol(symbol);
        generatorContext.addImportedIdentifier(symbol.local, getRuntimeAlias(symbol.local), symbol.reactive ? 'signal' : 'value');
      }

      const root = this._writeBody(this._ast, { id: ROOT_NODE }, generatorContext, '{ get: () => undefined }');
      const code = ['function render(out) {', ...indent(root), '}'];
      for (const [key, { fn, args }] of this._functions) {
        const body = this._writeBody(fn.node.children, fn.parent, fn.context, 'parentContext', fn.precode);
        code.push('', `function ${key}(${args.join(', ')}) {`, ...indent(body), '}');
      }

      // Read by the event contract of the page: a template without listeners adds nothing
      if (generatorContext.eventNames.size) {
        code.push('', `render.events = ${JSON.stringify(Array.from(generatorContext.eventNames))};`);
      }

      // Only the symbols an expression reads are imported: a type, or a name only a type argument uses, is not a value at runtime
      const symbolImports = symbols.filter(({ local }) => generatorContext.getImportedIdentifier(local)!.used).map(toRuntimeImport);
      return RUNTIME_IMPORTS.concat(symbolImports, code).join('\n');
    } catch (error) {
      throw formatErrorWithPrefix('Server generator', this._input, error);
    }
  }

  /**
   * Writes the body of a function: the runtime context of its scope, the code preparing it, the declarations of the
   * scope, and the code of the nodes. The functions the code calls are added to the ones to write.
   *
   * Every function is a scope declaring its element refs, its templates and its `@let`: the root, a block, the body of
   * a `@for`, the content of a template or of an element a structural directive is applied to. The children of any
   * other element are written in the function of their scope.
   *
   * @param nodes - The nodes the function renders.
   * @param parent - Where the nodes are rendered.
   * @param generatorContext - The generator context of the nodes.
   * @param parentContext - The expression of the parent of the runtime context of the function, which is created for the
   *   variables of its scope: the ones its precode registers, and its declarations.
   * @param precode - The code preparing the context, e.g. declaring the item of a `@for`, if any.
   * @returns The lines of the body.
   */
  private _writeBody(nodes: readonly ASTNode[], parent: ServerParent, generatorContext: GeneratorContext, parentContext: string, precode?: string): string[] {
    // Declared first, so that the context is created for the variables of the scope
    const declarations = declareScope(nodes, generatorContext, toTemplateFunction, '_ssrTemplate');
    const lines = [`const context = ${createContext(parentContext, undefined, generatorContext.identifierCount)};`];
    if (precode) {
      lines.push(...precode.split('\n'));
    }

    if (declarations) {
      lines.push(...declarations.code);
      // The functions of the templates, the only ones of the declarations, always declare their parameters (see toTemplateFunction)
      for (const [key, { fn, args }] of declarations.functionsToProcess) {
        this._functions.set(key, { fn: { node: fn.node, context: fn.context, precode: fn.precode, parent: { id: key } }, args: args! });
      }
    }

    const { pieces, functionsToProcess } = this._generateNodes(nodes, parent, generatorContext);
    const statements = toStatements(pieces);
    for (let i = 0; i < statements.length; i++) {
      lines.push(statements[i]);
    }

    for (const [key, fn] of functionsToProcess) {
      this._functions.set(key, fn);
    }

    return lines;
  }

  /**
   * Generates the code of sibling nodes, each one through the state of its type.
   *
   * @param nodes - The nodes.
   * @param parent - Where the nodes are rendered.
   * @param generatorContext - The generator context of the nodes.
   * @returns The code of the nodes, and the functions it calls.
   * @throws If a node has no state.
   */
  private _generateNodes(nodes: readonly ASTNode[], parent: ServerParent, generatorContext: GeneratorContext): Required<ServerTransitionResult> {
    const pieces = new Array<ServerCodePiece>();
    const functionsToProcess = new Map<string, ServerFunctionToProcess>();
    const separators = getTextSeparators(nodes, parent.tag, generatorContext.namespace);
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const state = this._states[node.type];
      if (!state) {
        throw new Error(`No transition function for ASTNode of type ${ASTNodeType[node.type]}`, { cause: node.span });
      }

      if (separators[i]) {
        pieces.push({ html: TEXT_MARKER });
      }

      const result = state(node as never, parent, i.toString(), generatorContext, this._generateChildren);
      if (!result) {
        continue;
      }

      for (let j = 0; j < result.pieces.length; j++) {
        pieces.push(result.pieces[j]);
      }

      if (result.functionsToProcess?.size) {
        for (const [key, fn] of result.functionsToProcess) {
          functionsToProcess.set(key, fn);
        }
      }
    }

    return { pieces, functionsToProcess };
  }
}

/**
 * The state of the nodes rendering nothing where they are: the imports, and the templates, declared at the start of
 * their scope.
 *
 * @returns Nothing.
 */
function skipNode(): undefined {
  return undefined;
}

/**
 * Describes the function rendering an instance of a template on the server: it creates the scope of the instance, whose
 * parent is the runtime context of the scope declaring the template, and declares the parameters, as the client does.
 *
 * @param template - The template.
 * @param key - The name of the function.
 * @param namespace - The namespace the content of the template is created in.
 * @param generatorContext - The generator context of the scope declaring the template.
 * @returns The function, taking the output, the runtime context of the scope declaring the template and the signals of
 *   the parameters.
 */
function toTemplateFunction(template: TemplateNode, key: string, namespace: ElementNamespace, generatorContext: GeneratorContext): GeneratorFunctionToProcess {
  const context = new GeneratorContext(generatorContext, namespace);
  return {
    fn: { node: template, parentNode: key, context, precode: declareTemplateParameters(template, context, SERVER_RESOLVE_OPTIONS).join('\n') },
    args: ['out', 'parentContext', 'params']
  };
}
