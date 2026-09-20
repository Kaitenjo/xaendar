import { indent, slice } from '@xaendar/common';
import { CompilerCache } from '@xaendar/compiler';
import { ASTNode } from '../parser/types/ast.type.js';
import { ASTNodeType } from '../parser/types/node.enum.js';
import { Span } from '../types/span.type.js';
import { CompilerContext } from './models/compiler-context.model.js';
import { generateElement } from './states/generate-element.state.js';
import { generateFor } from './states/generate-for.state.js';
import { generateIf } from './states/generate-if.state.js';
import { generateSwitch } from './states/generate-switch.state.js';
import { generateTextAndInterpolation } from './states/generate-text-and-interpolation.state.js';
import { skipGeneration } from './states/skip-generation.state.js';
import { GeneratorStates } from './types/generator-states.type.js';
import { GeneratorTransitionFunctionReturnType } from './types/generator-transition-function-return-type.type.js';
import { ROOT_NODE } from './utils/generator.utils.js';

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
    [ASTNodeType.Import]: skipGeneration
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
   * Generates the code for the given AST using the specified CSS variable name and signals.
   * @param cssVariableName The name of the CSS variable to be used in the generated code.
   * @param signals An array of signal names to be included in the generated code.
   * @returns The generated code as a string.
   */
  public async generate(cssVariableName: string | undefined, signals: string[]): Promise<string> {
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

      const generatedCode = [
        '_render() {',
        ...indent([
          `const ${ROOT_NODE} = this._root;`,
          'const context = new _Context(this, { createElement: document.createElement.bind(document), get: () => undefined });'
        ])
      ]

      if (cssVariableName) {
        generatedCode.push(indent(`${ROOT_NODE}.adoptedStyleSheets = [${cssVariableName}];`));
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
          `\n${key}(${fnData.args?.join(', ')}) {`,
          ...indent(['const context = new _Context(this, parentContext);'])
        );

        if (precode) {
          generatedCode.push(indent(precode));
        }

        const functionBody = [];
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

      return generatedCode.join("\n");
    } catch (err) {
      const error = err as Error;
      const { start, end } = error.cause as Span;
      throw new Error(`[Generator] ${error.message}\n----> ${slice(this._input, start, end)}`);
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