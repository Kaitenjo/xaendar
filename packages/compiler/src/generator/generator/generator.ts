import { indent } from '@xaendar/common';
import { ASTNode } from '../../parser/types/ast.type.js';
import { ASTNodeType } from '../../parser/types/node.enum.js';
import type { TemplateNode } from '../../parser/types/nodes/template-node.type.js';
import { isStructuralElement } from '../../parser/utils/scope-declarations/scope-declarations.utils.js';
import { CompilerCache } from '../../types/compiler-cache.type.js';
import type { ElementNamespace } from '../../types/element-namespace.type.js';
import type { SymbolImport } from '../../types/symbol-import.type.js';
import { catchErrorWithPrefix } from '../../utils/catch-error-generation/catch-error-generation.utils.js';
import { assertImportableSymbol, getRuntimeAlias, toRuntimeImport } from '../../utils/symbol-imports/symbol-imports.utils.js';
import { CompilerContext } from '../models/compiler-context/compiler-context.model.js';
import { generateElement } from '../states/generate-element/generate-element.state.js';
import { generateFor } from '../states/generate-for/generate-for.state.js';
import { generateClient } from '../states/generate-client/generate-client.state.js';
import { generateTry } from '../states/generate-try/generate-try.state.js';
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
import { getElementFactory, ROOT_NODE } from '../utils/generator/generator.utils.js';
import { getDeferredModules } from '../utils/deferred-modules/deferred-modules.utils.js';
import { declareScope, declareTemplateParameters } from '../utils/scope-generation/scope-generation.utils.js';
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
    private readonly _cache?: CompilerCache
  ) { }

  /**
   * Generates the code for the given AST using the specified signals.
   * @param signals An array of signal names to be included in the generated code.
   * @param shadowingMembers Class members named like a global identifier, read from the component instead of the global scope.
   * @param customElements Patterns of the tag names of the custom elements of other libraries, generated like native elements.
   * @param symbols The symbols the template imports from modules: the expressions read them through the declarations
   *   importing them, written first, only for the ones an expression reads (a type is never imported at runtime).
   * @returns The generated code as a string: the declarations importing the symbols, then module-level functions, the
   *   entry point being `render`, each expecting to be invoked with the component instance bound as `this`. `render`
   *   takes the strategy getting the nodes, created or adopted from the HTML rendered on the server, and every function
   *   takes the one of its scope, which its context gets.
   */
  public async generate(signals: string[], shadowingMembers: readonly string[] = [], customElements: readonly string[] = [], symbols: readonly SymbolImport[] = []): Promise<string> {
    /*
      The tag name of the element each function renders its nodes into, which tells where the server separates texts:
      the children of an element are rendered into it, a block into the element of the function it is in, the content
      of a template where it is rendered, as the server sees it
    */
    const parentTags = new Map<string, string | undefined>();
    const processFunctions = (functionsToProcess: GeneratorTransitionFunctionReturnType['functionsToProcess'], parentTag?: string) => {
      if (functionsToProcess) {
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
    };

    try {
      this._nodeToProcess.clear();
      const compilerContext = new CompilerContext();
      compilerContext.cache = this._cache;
      for (let i = 0; i < signals.length; i++) {
        compilerContext.addSignalClassField(signals[i]);
      }
      for (let i = 0; i < shadowingMembers.length; i++) {
        compilerContext.addShadowingMember(shadowingMembers[i]);
      }
      compilerContext.addCustomElementPatterns(...customElements);
      compilerContext.deferredModules = await getDeferredModules(this._ast, compilerContext);
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        assertImportableSymbol(symbol);
        compilerContext.addImportedIdentifier(symbol.local, getRuntimeAlias(symbol.local), symbol.reactive ? 'signal' : 'value');
      }

      const generatedCode = [
        'function render(nodeStrategy) {',
        ...indent([
          `const ${ROOT_NODE} = this._root;`,
          'const context = new _Context({ createElement: _createElement, get: () => undefined }, nodeStrategy);'
        ])
      ]

      const rootDeclarations = declareScope(this._ast, compilerContext, toTemplateFunction);
      if (rootDeclarations) {
        processFunctions(rootDeclarations.functionsToProcess);
        generatedCode.push(...indent(rootDeclarations.code));
      }

      const rootSeparators = getTextSeparators(this._ast, undefined, compilerContext.namespace);
      for (let i = 0; i < this._ast.length; i++) {
        const result = await this._processNode(this._ast[i], ROOT_NODE, i.toString(), compilerContext, null, rootSeparators[i]);
        if (result) {
          const { code, functionsToProcess } = result;
          processFunctions(functionsToProcess);
          generatedCode.push(...indent(code));
        }
      }

      generatedCode.push(
        ...indent(['return context;']),
        '}'
      )

      for (const [key, fnData] of this._nodeToProcess.entries()) {
        const { node, parentNode, context, precode, anchor } = fnData.fn;
        const parentTag = parentTags.get(key);

        generatedCode.push(
          `\nfunction ${key}(${fnData.args?.join(', ')}) {`,
          ...indent(['const context = new _Context(parentContext, nodeStrategy);'])
        );

        if (precode) {
          generatedCode.push(indent(precode));
        }

        /*
          A block, the content of an element a structural directive is applied to, or the content of a template, is a scope
          declaring its element refs, its templates and its @let
        */
        const declarations = node.type !== ASTNodeType.Element || isStructuralElement(node) ? declareScope(node.children, context, toTemplateFunction) : undefined;
        if (declarations) {
          processFunctions(declarations.functionsToProcess);
          generatedCode.push(...indent(declarations.code));
        }

        const separators = getTextSeparators(node.children, parentTag, context.namespace);
        const functionBody = new Array<string>;
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          const result = await this._processNode(child, parentNode, i.toString(), context, anchor ?? null, separators[i]);
          if (result) {
            const { code, functionsToProcess } = result;
            processFunctions(functionsToProcess, parentTag);
            functionBody.push(...code);
          }
        }

        generatedCode.push(
          ...indent([
            ...functionBody,
            fnData.fn.isForBody ? 'return { context, update };' : 'return context;'
          ]),
          '}'
        );
      }

      // Only the symbols an expression reads are imported: a type, or a name only a type argument uses, is not a value at runtime
      const imports = symbols.filter(({ local }) => compilerContext.getImportedIdentifier(local)!.used).map(toRuntimeImport);
      return (imports.length ? imports.concat(generatedCode) : generatedCode).join('\n');
    } catch (err) {
      throw catchErrorWithPrefix('Generator', this._input, err);
    }
  }

  /**
   * Processes a single AST node and generates the corresponding code.
   * @param node The AST node to process.
   * @param parentNode The variable name of the parent node in the generated code.
   * @param index The index of the node among its siblings.
   * @param compilerContext The context object containing compiler-related information.
   * @param anchor The anchor point for inserting the generated code, if applicable.
   * @param separated Whether the server writes `<!---->` before the node (see `getTextSeparators`).
   * @returns The result of processing the node, including generated code and functions to process, or undefined if no code is generated.
   */
  private async _processNode(node: ASTNode, parentNode: string, index: string, compilerContext: CompilerContext, anchor: string | null, separated: boolean): Promise<GeneratorTransitionFunctionReturnType | undefined> {
    const state = this._states[node.type];
    if (!state) {
      throw new Error(`No transition function for ASTNode of type ${ASTNodeType[node.type]}`, { cause: node.span });
    }

    return await state(node as never, parentNode, index, compilerContext, anchor, separated);
  }
}

/**
 * Describes the function rendering an instance of a template: it creates the scope of the instance, whose parent is the
 * runtime context of the scope declaring the template, so that its content reads the names visible where the template
 * is declared, and not where it is rendered. The parameters are signals, read like the item of a `@for` (see
 * `declareTemplateParameters`).
 *
 * @param template - The template.
 * @param key - The name of the function.
 * @param namespace - The namespace the content of the template is created in, the one of its declaration: the factory
 *   of the elements of the instance is set explicitly, since the scope declaring the template may create its elements
 *   in another namespace.
 * @param compilerContext - The compiler context of the scope declaring the template.
 * @returns The function, taking the element the instance is rendered into, the runtime context of the scope declaring
 *   the template, the node the instance is rendered before, the signals of the parameters and the strategy getting the
 *   nodes of the instance.
 */
function toTemplateFunction(template: TemplateNode, key: string, namespace: ElementNamespace, compilerContext: CompilerContext): GeneratorFunctionToProcess {
  const context = new CompilerContext(compilerContext, namespace);
  const precode = [`context.createElement = ${getElementFactory(namespace)};`, ...declareTemplateParameters(template, context)];

  return {
    fn: { node: template, parentNode: key, context, precode: precode.join('\n  '), anchor: 'anchor' },
    args: [key, 'parentContext', 'anchor', 'params', 'nodeStrategy']
  };
}