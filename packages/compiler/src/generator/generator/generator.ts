import { indent } from '@xaendar/common';
import { ASTNode } from '../../parser/types/ast.type.js';
import { ASTNodeType } from '../../parser/types/node.enum.js';
import type { TemplateNode } from '../../parser/types/nodes/template-node.type.js';
import { isStructuralElement } from '../../parser/utils/scope-declarations/scope-declarations.utils.js';
import { isLastRenderedChild } from '../utils/block-position/block-position.utils.js';
import { ContextCache } from '../../types/context-cache.type.js';
import type { ElementNamespace } from '../../types/element-namespace.type.js';
import type { SymbolImport } from '../../types/symbol-import.type.js';
import { catchErrorWithPrefix } from '../../utils/catch-error-generation/catch-error-generation.utils.js';
import { assertImportableSymbol, getRuntimeAlias, toRuntimeImport } from '../../utils/symbol-imports/symbol-imports.utils.js';
import { GeneratorContext } from '../context/context.js';
import { generateElement } from '../states/generate-element/generate-element.state.js';
import { generateFor } from '../states/generate-for/generate-for.state.js';
import { generateClient } from '../states/generate-client/generate-client.state.js';
import { generateTry } from '../states/generate-try/generate-try.state.js';
import { generateDefer } from '../states/generate-defer/generate-defer.state.js';
import { generateHydrate } from '../states/generate-hydrate/generate-hydrate.state.js';
import { generateIf } from '../states/generate-if/generate-if.state.js';
import { generateLet } from '../states/generate-let/generate-let.state.js';
import { generateRender } from '../states/generate-render/generate-render.state.js';
import { generateSwitch } from '../states/generate-switch/generate-switch.state.js';
import { generateTextAndInterpolation } from '../states/generate-text-and-interpolation/generate-text-and-interpolation.state.js';
import { skipGeneration } from '../states/skip-generation/skip-generation.state.js';
import { GeneratorStates } from '../types/generator-states.type.js';
import type { GeneratorFunctionToProcess } from '../types/generator-function-to-process.type.js';
import { GeneratorTransitionFunctionReturnType } from '../types/generator-transition-function-return-type.type.js';
import { ROOT_NODE } from '../utils/generator/generator.utils.js';
import { getDeferredModules } from '../utils/deferred-modules/deferred-modules.utils.js';
import { createScope, declareScope, declareTemplateParameters } from '../utils/scope-generation/scope-generation.utils.js';
import { getTextSeparators } from '../utils/text-separators/text-separators.utils.js';

/**
 * The Generator class is responsible for generating code from an abstract syntax tree (AST) representation of the input source code. 
 * It manages the state transitions and processing of different types of AST nodes to produce the final output code.
 */
export class Generator {
  /**
   * Map storing nodes that need to be processed along with their associated functions.
   */
  private readonly _nodeToProcess: Required<GeneratorTransitionFunctionReturnType>['functionsToProcess'] = new Map();
  /**
   * Map of generator states corresponding to different AST node types.
   */
  private readonly _states: GeneratorStates = {
    [ASTNodeType.Text]: generateTextAndInterpolation,
    [ASTNodeType.Interpolation]: generateTextAndInterpolation,
    [ASTNodeType.Element]: generateElement,
    [ASTNodeType.If]: generateIf,
    [ASTNodeType.For]: generateFor,
    [ASTNodeType.Switch]: generateSwitch,
    [ASTNodeType.Hydrate]: generateHydrate,
    [ASTNodeType.Client]: generateClient,
    [ASTNodeType.Try]: generateTry,
    [ASTNodeType.Defer]: generateDefer,
    [ASTNodeType.Import]: skipGeneration,
    [ASTNodeType.Template]: skipGeneration,
    [ASTNodeType.Render]: generateRender,
    [ASTNodeType.Let]: generateLet
  }

  /**
   * Initializes a new instance of the Generator class with the given input and AST.
   * @param _input The input source code as a string.
   * @param _ast The abstract syntax tree representing the parsed structure of the input.
   */
  constructor(
    private readonly _input: string,
    private readonly _ast: ASTNode[],
    private readonly _cache: ContextCache
  ) { }

  /**
   * Generates the code for the given AST using the specified signals.
   * @param signals An array of signal names to be included in the generated code.
   * @param shadowingMembers Class members named like a global identifier, read from the component instead of the global scope.
   * @param customElements Patterns of the tag names of the custom elements of other libraries, generated like native elements.
   * @param symbols The symbols the template imports from modules: the expressions read them through the declarations
   *   importing them, written first, only for the ones an expression reads (a type is never imported at runtime).
   * @returns The generated code as a string: the declarations importing the symbols, the constants listing the
   *   variables of the template the bindings read (see `GeneratorContext.getReads`), the constants describing the
   *   elements and the blocks (see `GeneratorContext.declareConstant`), then module-level functions: the entry point,
   *   `render`, invoked with the component instance bound as `this`, which it gives to the root context, the functions
   *   rendering the blocks, which the runtime calls as they are, and the ones computing the expressions, which the
   *   runtime calls with the component as `this` and the context (see `GeneratorContext.declareFunction`). `render`
   *   takes the strategy getting the nodes, created or adopted from the HTML rendered on the server, and every function
   *   takes the one of its scope, which its context gets. Each runtime scope is created from the layout of its block
   *   (see `GeneratorContext.declareLayout`), declared once the body of its function is generated.
   */
  public async generate(signals: string[], shadowingMembers: readonly string[] = [], customElements: readonly string[] = [], symbols: readonly SymbolImport[] = []): Promise<string> {
    /*
      The tag name of the element each function renders its nodes into, which tells where the server separates texts:
      the children of an element are rendered into it, a block into the element of the function it is in, the content
      of a template where it is rendered, as the server sees it
    */
    const parentTags = new Map<string, string | undefined>();

    try {
      this._nodeToProcess.clear();
      const generatorContext = new GeneratorContext(this._cache);
      for (let i = 0; i < signals.length; i++) {
        generatorContext.addSignalClassField(signals[i]);
      }
      for (let i = 0; i < shadowingMembers.length; i++) {
        generatorContext.addShadowingMember(shadowingMembers[i]);
      }
      generatorContext.addCustomElementPatterns(...customElements);
      generatorContext.deferredModules = await getDeferredModules(this._ast, generatorContext);
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        assertImportableSymbol(symbol);
        generatorContext.addImportedIdentifier(symbol.local, getRuntimeAlias(symbol.local), symbol.reactive ? 'signal' : 'value');
      }

      // Declared first, so that the slots of the variables of the scope precede the reads of its body
      const rootDeclarations = declareScope(this._ast, generatorContext, toTemplateFunction);
      const generatedCode = [
        'function render(nodeStrategy) {',
        indent(`const ${ROOT_NODE} = this._root;`)
      ];
      // The root of a render tracks no node: they stay in the shadow root of the component, removed with it
      const rootScopeLine = generatedCode.push('') - 1;

      if (rootDeclarations) {
        this._processFunctions(parentTags, rootDeclarations.functionsToProcess);
        generatedCode.push(...indent(rootDeclarations.code));
      }

      const rootSeparators = getTextSeparators(this._ast, undefined, generatorContext.namespace);
      for (let i = 0; i < this._ast.length; i++) {
        const result = await this._processNode(this._ast[i], ROOT_NODE, i.toString(), generatorContext, null, rootSeparators[i], isLastRenderedChild(this._ast, i));
        if (result) {
          const { code, functionsToProcess } = result;
          this._processFunctions(parentTags, functionsToProcess);
          generatedCode.push(...indent(code));
        }
      }

      generatedCode[rootScopeLine] = indent(`const context = ${createScope('null', generatorContext.declareLayout(), 'nodeStrategy', 'this')};`);
      generatedCode.push(
        ...indent(['return context;']),
        '}'
      )

      for (const [key, fnData] of this._nodeToProcess.entries()) {
        const { node, parentNode, context, precode, anchor } = fnData.fn;
        const parentTag = parentTags.get(key);

        /*
          A block, the content of an element a structural directive is applied to, or the content of a template, is a scope
          declaring its element refs, its templates and its @let, after the variables its precode registers: its context is
          created for all of them. The children of any other element share the generator context of their scope
        */
        const isElement = node.type === ASTNodeType.Element;
        const isScope = !isElement || isStructuralElement(node);
        const declarations = isScope ? declareScope(node.children, context, toTemplateFunction) : undefined;
        /*
          N.B. Deliberate, to save memory: a context is created only for a scope, a block (its precode registering the
          variables of a @for, the error of a @catch, the parameters of a template) or the children of an element declaring
          names, as the content of an element a structural directive is applied to may. The children of any other element
          are rendered in the runtime context the element is rendered in, which the function receives as `context`,
          instead of one created for them, which a large table would pay per cell: the children of an <svg>, a <math> or a
          <foreignObject> too, their elements naming their namespace (see `generateElement`). Do not create one for every
          element, nor to change how the elements are created
        */
        const createsContext = !isElement || (isScope && context.identifierCount > 0);
        generatedCode.push(`\nfunction ${key}(${(createsContext ? fnData.args! : [fnData.args![0], 'context']).join(', ')}) {`);
        // Written once the body is generated, which gives the nodes at its top their slots
        const scopeLine = createsContext ? generatedCode.push('') - 1 : -1;

        if (precode) {
          generatedCode.push(indent(precode));
        }

        if (declarations) {
          this._processFunctions(parentTags, declarations.functionsToProcess);
          generatedCode.push(...indent(declarations.code));
        }

        const separators = getTextSeparators(node.children, parentTag, context.namespace);
        const functionBody = new Array<string>;
        context.tracksNodes = createsContext;
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          /*
            A function without anchor renders at the end of the node it renders into (the children of an element, the
            content of a block without anchor): its last block needs none either
          */
          const last = !anchor && isLastRenderedChild(node.children, i);
          const result = await this._processNode(child, parentNode, i.toString(), context, anchor ?? null, separators[i], last);
          if (result) {
            const { code, functionsToProcess } = result;
            this._processFunctions(parentTags, functionsToProcess, parentTag);
            functionBody.push(...code);
          }
        }

        context.tracksNodes = false;
        if (createsContext) {
          generatedCode[scopeLine] = indent(`const context = ${createScope('parentContext', context.declareLayout(), isElement ? undefined : 'nodeStrategy')};`);
          functionBody.push('return context;');
        }

        generatedCode.push(...indent(functionBody), '}');
      }

      // The functions of the module computing the expressions follow the ones rendering the blocks
      const expressions = generatorContext.functionDeclarations;
      for (let i = 0; i < expressions.length; i++) {
        generatedCode.push(`\n${expressions[i]}`);
      }

      // Only the symbols an expression reads are imported: a type, or a name only a type argument uses, is not a value at runtime
      const imports = symbols.filter(({ local }) => generatorContext.getImportedIdentifier(local)!.used).map(toRuntimeImport);
      // The constants of the module read the ones listing the variables the bindings read; the layout of the root scope is always one of them
      return imports.concat(generatorContext.readsDeclarations, generatorContext.constantDeclarations, generatedCode).join('\n');
    } catch (err) {
      throw catchErrorWithPrefix('Generator', this._input, err);
    }
  }

  /**
   * Queues the functions a node needs to generate, and records the tag name of the element each one renders its nodes
   * into: the one of an element for its children, none for the content of a template, the one of the function holding
   * it for a block.
   *
   * @param parentTags - The tag names, by name of the function.
   * @param functionsToProcess - The functions, if any.
   * @param parentTag - The tag name of the element the function holding the node renders into.
   */
  private _processFunctions(parentTags: Map<string, string | undefined>, functionsToProcess: GeneratorTransitionFunctionReturnType['functionsToProcess'], parentTag?: string): void {
    if (!functionsToProcess?.size) {
      return;
    }

    for (const [key, value] of functionsToProcess.entries()) {
      this._nodeToProcess.set(key, value);
      const { node } = value.fn;
      switch (node.type) {
        case ASTNodeType.Element:
          parentTags.set(key, node.tagName);
          break;

        case ASTNodeType.Template:
          parentTags.set(key, undefined);
          break;

        default:
          parentTags.set(key, parentTag);
      }
    }
  }

  /**
   * Processes a single AST node and generates the corresponding code.
   * @param node The AST node to process.
   * @param parentNode The variable name of the parent node in the generated code.
   * @param index The index of the node among its siblings.
   * @param generatorContext The context object containing compiler-related information.
   * @param anchor The anchor point for inserting the generated code, if applicable.
   * @param separated Whether the server writes `<!---->` before the node (see `getTextSeparators`).
   * @param last Whether the node is the last one of the node it is rendered into, where a block needs no anchor (see
   *   `isLastRenderedChild`).
   * @returns The result of processing the node, including generated code and functions to process, or undefined if no code is generated.
   */
  private async _processNode(node: ASTNode, parentNode: string, index: string, generatorContext: GeneratorContext, anchor: string | null, separated: boolean, last: boolean): Promise<GeneratorTransitionFunctionReturnType | undefined> {
    const state = this._states[node.type];
    if (!state) {
      throw new Error(`No transition function for ASTNode of type ${ASTNodeType[node.type]}`, { cause: node.span });
    }

    return await state(node as never, parentNode, index, generatorContext, anchor, separated, last);
  }
}

/**
 * Describes the function rendering an instance of a template: it creates the scope of the instance, whose parent is the
 * runtime scope declaring the template, so that its content reads the variables visible where the template is declared,
 * and not where it is rendered. The parameters are variables of the template, read like the item of a `@for` (see
 * `declareTemplateParameters`), the first slots of the scope, whose identifiers the constant of the module describing
 * the template lists (`template_row_12$template`, see `declareScope`): a `@render` passing other arguments updates
 * them by position, and refreshes the instance with their identifiers.
 *
 * @param template - The template.
 * @param key - The name of the function.
 * @param namespace - The namespace the content of the template is created in, the one of its declaration, which its
 *   elements name (see `generateElement`), wherever the instance is rendered.
 * @param generatorContext - The generator context of the scope declaring the template.
 * @returns The function, taking the element the instance is rendered into, the runtime context of the scope declaring
 *   the template, the node the instance is rendered before, the values of the arguments and the strategy getting the
 *   nodes of the instance.
 */
function toTemplateFunction(template: TemplateNode, key: string, namespace: ElementNamespace, generatorContext: GeneratorContext): GeneratorFunctionToProcess {
  const context = new GeneratorContext(generatorContext, namespace);
  const precode = declareTemplateParameters(template, key, context);

  return {
    fn: { node: template, parentNode: key, context, precode: precode.length ? precode.join('\n  ') : undefined, anchor: 'anchor' },
    args: [key, 'parentContext', 'anchor', 'params', 'nodeStrategy']
  };
}