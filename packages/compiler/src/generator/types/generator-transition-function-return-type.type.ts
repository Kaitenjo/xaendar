import { ASTNode } from '../../parser/types/ast.type'
import { GeneratorContext } from '../context/context'

export type GeneratorTransitionFunctionReturnType = {
  /**
   * Generated source code lines to be emitted at the call site of the
   * processed node (e.g. the `_renderElement(...)`, `_if(...)`, `_for(...)`
   * or `_switch(...)` invocation representing this node).
   */
  code: string[];
  /**
   * Additional helper functions that must be generated as separate methods
   * on the component class (e.g. `if0`, `for4`, `label0Children`), keyed by
   * their generated method name. Populated when a node produces content that
   * cannot be inlined at the call site — such as branch bodies for `_if`/
   * `_switch`, iteration bodies for `_for`, or child-rendering helpers for
   * an element's children.
   */
  functionsToProcess?: Map<string, {
    fn: {
      /**
       * The AST node whose children should be generated inside this
       * function's body.
       */
      node: Extract<ASTNode, { children: ASTNode[] }>,
      /**
       * Identifier of the DOM node (in the generated code) that this
       * function's children are rendered into.
       */
      parentNode: string;
      /**
       * The compiler scope context active inside this function, used to
       * resolve identifiers (e.g. loop variables, aliases) when generating
       * the function's children.
       */
      context: GeneratorContext;
      /**
       * Optional line(s) of code to prepend to the function body, before
       * its children are generated (e.g. the `_iterationVariables(...)`
       * declaring the variables of a `@for` block).
       */
      precode?: string;
      /**
       * The name of the variable holding the node the function renders before (`anchor`), which its direct rendering
       * calls forward: the one of a branch of a block, of the body of a `@for`, of the content of a template.
       * `undefined` when the function renders at the end of the node it renders into, its calls passing `null`: the
       * children of an element, and the content of the last block of its parent (see `getContentAnchor`), whose own last
       * block then needs no anchor either.
       */
      anchor?: string;
    };
    /**
     * Names of the parameters this generated function should declare, in
     * order (e.g. `[parentNode, 'parentContext', 'anchor']`). Determines the
     * function's signature as emitted in the generated source.
     */
    args?: string[];
  }>;
};