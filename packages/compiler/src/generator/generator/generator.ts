import { indent } from '@xaendar/common';
import { ASTNode } from '../../parser/types/ast.type.js';
import { ASTNodeType } from '../../parser/types/node.enum.js';
import type { TemplateNode } from '../../parser/types/nodes/template-node.type.js';
import { isStructuralElement, visitScopeDeclarations } from '../../parser/utils/scope-declarations/scope-declarations.utils.js';
import { CompilerCache } from '../../types/compiler-cache.type.js';
import type { ElementNamespace } from '../../types/element-namespace/element-namespace.type.js';
import type { SymbolImport } from '../../types/imported-symbol/imported-symbol.type.js';
import { catchErrorWithPrefix } from '../../utils/catch-error-generation/catch-error-generation.utils.js';
import { assertImportableSymbol, getRuntimeAlias, toRuntimeImport } from '../../utils/symbol-imports/symbol-imports.utils.js';
import { CompilerContext } from '../models/compiler-context/compiler-context.model.js';
import { generateElement } from '../states/generate-element/generate-element.state.js';
import { generateFor } from '../states/generate-for/generate-for.state.js';
import { generateIf } from '../states/generate-if/generate-if.state.js';
import { generateRender } from '../states/generate-render/generate-render.state.js';
import { generateSwitch } from '../states/generate-switch/generate-switch.state.js';
import { generateTextAndInterpolation } from '../states/generate-text-and-interpolation/generate-text-and-interpolation.state.js';
import { skipGeneration } from '../states/skip-generation/skip-generation.state.js';
import { GeneratorStates } from '../types/generator-states.type.js';
import type { GeneratorFunctionToProcess } from '../types/generator-function-to-process/generator-function-to-process.type.js';
import { GeneratorTransitionFunctionReturnType } from '../types/generator-transition-function-return-type.type.js';
import { getElementFactory, resolveExpression, ROOT_NODE } from '../utils/generator/generator.utils.js';

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
    [ASTNodeType.Import]: skipGeneration,
    // A template is registered at the start of its scope, its content is rendered by each @render calling it
    [ASTNodeType.Template]: skipGeneration,
    [ASTNodeType.Render]: generateRender
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
   *   entry point being `render`, each expecting to be invoked with the component instance bound as `this`.
   */
  public async generate(signals: string[], shadowingMembers: readonly string[] = [], customElements: readonly string[] = [], symbols: readonly SymbolImport[] = []): Promise<string> {
    const processFunctions = (functionsToProcess: GeneratorTransitionFunctionReturnType['functionsToProcess']) => {
      if (functionsToProcess) {
        for (const [key, value] of functionsToProcess.entries()) {
          this._nodeToProcess.set(key, value)
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
      for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        assertImportableSymbol(symbol);
        compilerContext.addImportedIdentifier(symbol.local, getRuntimeAlias(symbol.local), symbol.reactive ? 'signal' : 'value');
      }

      const generatedCode = [
        'function render() {',
        ...indent([
          `const ${ROOT_NODE} = this._root;`,
          'const context = new _Context({ createElement: document.createElement.bind(document), get: () => undefined });'
        ])
      ]

      const rootDeclarations = declareScope(this._ast, compilerContext);
      if (rootDeclarations) {
        processFunctions(rootDeclarations.functionsToProcess);
        generatedCode.push(...indent(rootDeclarations.code));
      }

      for (let i = 0; i < this._ast.length; i++) {
        const result = await this._processNode(this._ast[i], ROOT_NODE, i.toString(), compilerContext, null);
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

        generatedCode.push(
          `\nfunction ${key}(${fnData.args?.join(', ')}) {`,
          ...indent(['const context = new _Context(parentContext);'])
        );

        if (precode) {
          generatedCode.push(indent(precode));
        }

        /*
          A block, the content of an element a structural directive is applied to, or the content of a template, is a scope
          declaring its template variables and its templates
        */
        const declarations = node.type !== ASTNodeType.Element || isStructuralElement(node) ? declareScope(node.children, context) : undefined;
        if (declarations) {
          processFunctions(declarations.functionsToProcess);
          generatedCode.push(...indent(declarations.code));
        }

        const functionBody = new Array<string>;
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          const result = await this._processNode(child, parentNode, i.toString(), context, anchor ?? null);
          if (result) {
            const { code, functionsToProcess } = result;
            processFunctions(functionsToProcess);
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
   * @returns The result of processing the node, including generated code and functions to process, or undefined if no code is generated.
   */
  private async _processNode(node: ASTNode, parentNode: string, index: string, compilerContext: CompilerContext, anchor: string | null): Promise<GeneratorTransitionFunctionReturnType | undefined> {
    const state = this._states[node.type];
    if (!state) {
      throw new Error(`No transition function for ASTNode of type ${ASTNodeType[node.type]}`, { cause: node.span });
    }

    return await state(node as never, parentNode, index, compilerContext, anchor);
  }
}

/**
 * Declares the template variables and the templates of a scope: registers them in its compiler context, so that every
 * expression and every `@render` of the scope reads them, the ones written before their declaration too, and writes the
 * code declaring them in its runtime context:
 * - a template variable is declared uninitialized, and the element it names initializes it once rendered;
 * - a template is initialized with the function rendering its content (see {@link toTemplateFunction}), together with
 *   the runtime context of the scope, which its content reads names from.
 *
 * @param nodes - The nodes of the scope.
 * @param compilerContext - The compiler context of the scope.
 * @returns The code declaring the names, and the functions rendering the content of the templates, `undefined` if the
 *   scope declares none.
 */
function declareScope(nodes: readonly ASTNode[], compilerContext: CompilerContext): Required<GeneratorTransitionFunctionReturnType> | undefined {
  let declarations: Required<GeneratorTransitionFunctionReturnType> | undefined;
  const add = (line: string): Required<GeneratorTransitionFunctionReturnType> => {
    declarations ??= { code: [], functionsToProcess: new Map() };
    declarations.code.push(line);
    return declarations;
  };

  visitScopeDeclarations(nodes, compilerContext.namespace, {
    variable: (_element, { name }) => {
      compilerContext.addIdentifier(name, 'value');
      add(`context.declare('${name}');`);
    },
    template: (template, namespace) => {
      const { name } = template.variable;
      const key = `template_${name}_${template.span.start}`;
      compilerContext.addIdentifier(name, 'value');
      compilerContext.addTemplate(name, namespace);
      add(`context.addIdentifier('${name}', _template(context, ${key}.bind(this)));`).functionsToProcess.set(key, toTemplateFunction(template, key, namespace, compilerContext));
    }
  });

  return declarations;
}

/**
 * Describes the function rendering an instance of a template: it creates the scope of the instance, whose parent is the
 * runtime context of the scope declaring the template, so that its content reads the names visible where the template
 * is declared, and not where it is rendered. The parameters are signals, read like the item of a `@for`: the one of
 * a parameter whose argument is left out holds its default value, or `undefined`.
 *
 * @param template - The template.
 * @param key - The name of the function.
 * @param namespace - The namespace the content of the template is created in, the one of its declaration: the factory
 *   of the elements of the instance is set explicitly, since the scope declaring the template may create its elements
 *   in another namespace.
 * @param compilerContext - The compiler context of the scope declaring the template.
 * @returns The function, taking the element the instance is rendered into, the runtime context of the scope declaring
 *   the template, the node the instance is rendered before and the signals of the parameters.
 */
function toTemplateFunction(template: TemplateNode, key: string, namespace: ElementNamespace, compilerContext: CompilerContext): GeneratorFunctionToProcess {
  const context = new CompilerContext(compilerContext, namespace);
  const precode = [`context.createElement = ${getElementFactory(namespace)};`];
  const { parameters } = template;
  for (let i = 0; i < parameters.length; i++) {
    context.addIdentifier(parameters[i].name, 'signal');
  }

  // An argument the @render may leave out takes the default value of its parameter, which reads the parameters before it
  for (let i = 0; i < parameters.length; i++) {
    const { name, optional, initializer } = parameters[i];
    let param = `params[${i}]`;
    if (initializer) {
      param = `_parameter(params, ${i}, () => ${resolveExpression(initializer, context).expression})`;
    } else if (optional) {
      param = `_parameter(params, ${i})`;
    }

    precode.push(`context.addIdentifier('${name}', ${param});`);
  }

  return {
    fn: { node: template, parentNode: key, context, precode: precode.join('\n  '), anchor: 'anchor' },
    args: [key, 'parentContext', 'anchor', 'params']
  };
}