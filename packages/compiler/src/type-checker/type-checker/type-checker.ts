import type { ASTNode } from '../../parser/types/ast.type.js';
import { ASTNodeType } from '../../parser/types/node.enum.js';
import { ComponentOrDirectiveMetadata } from '../../types/component-or-directive-metadata.type.js';
import { catchErrorWithPrefix } from '../../utils/catch-error-generation/catch-error-generation.utils.js';
import { TypeCheckContext } from '../models/type-checker-context/type-checker-context.js';
import { typeCheckElement } from '../states/type-check-element/type-check-element.state.js';
import { typeCheckFor } from '../states/type-check-for/type-check-for.state.js';
import { typeCheckIf } from '../states/type-check-if/type-check-if.state.js';
import { typeCheckSwitch } from '../states/type-check-switch/type-check-switch.state.js';
import { typeCheckTextAndInterpolation } from '../states/type-check-text-and-interpolation/type-check-text-and-interpolation.state.js';
import type { Line, LineMapping } from '../types/generated-line.type.js';
import type { TypeCheckResult } from '../types/type-checker-result.type.js';
import type { TypeCheckerStates } from '../types/type-checker-states.type.js';
import { indentLines, plain } from '../utils/line-builder/line-builder.utils.js';

/**
 * Generates a single, flat TypeScript function body ("shim") from a
 * template AST, meant only to be fed to the TS compiler / LanguageService
 * for diagnostics — it is never executed and never emitted as real output.
 *
 * This deliberately does NOT mirror the JS code generator's structure:
 *
 * - No variable is declared per HTML element. Element identifiers exist in
 *   the JS output purely so runtime code can create/reference the actual
 *   DOM node; a type-check expression never references "the element
 *   itself" (the DSL has no template-ref syntax), so an `HTMLElement`
 *   local would add zero type-checking value.
 * - No control-flow block gets its own function. In the JS output, each
 *   `@if`/`@for`/`@switch` becomes a separate function because it needs
 *   its own runtime closure over the `Context` chain. The type checker has
 *   no runtime at all, so real, nested TypeScript blocks — `if`, `for`,
 *   `switch` — give correct scoping and (as a bonus) real control-flow
 *   narrowing, for free, with no synthetic machinery.
 *
 * Every AST node turns directly into TypeScript lines, recursively, inside
 * one single `typeCheck()` function.
 */
export class TypeChecker {
  /** 
   * Shared mutable state threaded through all state functions during a single `generate()` call. 
   */
  private readonly _context = new TypeCheckContext();
  /** 
   * Maps each `ASTNodeType` to the state function responsible for emitting its type-check lines. 
   */
  private readonly _states: TypeCheckerStates = {
    [ASTNodeType.Text]: typeCheckTextAndInterpolation,
    [ASTNodeType.Interpolation]: typeCheckTextAndInterpolation,
    [ASTNodeType.Element]: typeCheckElement,
    [ASTNodeType.If]: typeCheckIf,
    [ASTNodeType.For]: typeCheckFor,
    [ASTNodeType.Switch]: typeCheckSwitch,
    [ASTNodeType.Import]: () => []
  };

  /**
   * @param _input - Raw template source string, used only to slice diagnostic spans into error messages.
   * @param _ast   - Parsed AST produced by the `Parser` for this template.
   */
  constructor(
    private _input: string, 
    private _ast: ASTNode[],
  ) { }

  /**
   * Generates the full `function typeCheck() { ... }` shim body for the
   * component's template.
   *
   * `$event` is not declared at the top of the shim: every event binding passing it
   * to its handler gets its own block declaring it, as `CustomEvent<payload type>` for a component or directive
   * `@Event` carrying a payload, and through the event map of the element for a native event, e.g.
   * `HTMLElementEventMap['click']` or, inside an `<svg>`, `SVGElementEventMap['click']`.
   *
   * @param metadatas - Metadata of the components and directives imported in the template, used to check the elements and directives using their selectors.
   * @returns The text of the shim, together with the table mapping its lines to the spans of the template they come from.
   * @throws If the template fails type-checking, e.g. it uses a selector not imported in it, with the error message prefixed by `[TypeChecker]` and, when the error carries its span, the slice of the template it refers to.
   */
  public async generate(metadatas: ComponentOrDirectiveMetadata[]): Promise<TypeCheckResult> {
    try {
      this._context.addImport(...metadatas);
      const body = this._ast.flatMap(node => this._processNode(node, this._context));

      const lines: Line[] = [
        plain('function typeCheck() {'),
        ...indentLines(body),
        plain('}'),
      ];

      return {
        text: lines.map(line => line.text).join('\n'),
        mappingTable: this.buildMappingTable(lines)
      };
    } catch (err) {
      throw catchErrorWithPrefix('TypeChecker', this._input, err);
    }
  }

  /**
   * Builds a mapping table that correlates each generated line to its original source span.
   * @param lines - Array of lines generated for the type-checking shim.
   * @returns A mapping table correlating generated lines to their original source spans.
   */
  private buildMappingTable(lines: Line[]): TypeCheckResult['mappingTable'] {
    const table = new Map<number, readonly LineMapping[]>();
    lines.forEach((line, index) => {
      if (line.mappings) {
        table.set(index, line.mappings)
      };
    });
    return table;
  }

  /**
   * Dispatches a single AST node to its state function, passing itself
   * back down as `processNode` so state functions can recurse into their
   * own children inline.
   */
  private _processNode = (node: ASTNode, context: TypeCheckContext): Line[] => {
    const state = this._states[node.type];

    if (!state) {
      throw new Error(`No transition function for ASTNode of type ${ASTNodeType[node.type]}`, { cause: node.span })
    }

    return state(node as never, this._processNode, context);
  };
}