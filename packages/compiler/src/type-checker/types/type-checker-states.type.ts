import { ASTNodeType } from '../../parser/types/node.enum'
import { ElementNode } from '../../parser/types/nodes/element-node.type'
import { ForNode } from '../../parser/types/nodes/for-node.type'
import { IfNode } from '../../parser/types/nodes/if-node.type'
import { ImportNode } from '../../parser/types/nodes/import-node.type'
import { InterpolationNode } from '../../parser/types/nodes/interpolation-node.type'
import type { LetNode } from '../../parser/types/nodes/let-node.type'
import type { RenderNode } from '../../parser/types/nodes/render-node.type'
import { SwitchNode } from '../../parser/types/nodes/switch-node.type'
import type { TemplateNode } from '../../parser/types/nodes/template-node.type'
import { TextNode } from '../../parser/types/nodes/text-node.type'
import { TypeCheckerTransitionFunction } from '../../type-checker/types/type-checker-transition-function.type'

type OmittedKeys = Exclude<ASTNodeType, 
 | ASTNodeType.Text
 | ASTNodeType.Interpolation
 | ASTNodeType.Element
 | ASTNodeType.If
 | ASTNodeType.For
 | ASTNodeType.Switch
 | ASTNodeType.Import
 | ASTNodeType.Template
 | ASTNodeType.Render
 | ASTNodeType.Let
>

/**
 * Maps each supported AST node type to its type checker transition function.
 * 
 * This structure allows the generator to dynamically select the appropriate
 * generation logic based on the current node type.
 * 
 * Each entry binds a concrete AST node type to a transition function that
 * emits the output fragments for that node.
 */
export type TypeCheckerStates = {
  [ASTNodeType.Text]: TypeCheckerTransitionFunction<TextNode | InterpolationNode>,
  [ASTNodeType.Interpolation]: TypeCheckerTransitionFunction<TextNode | InterpolationNode>
  [ASTNodeType.Element]: TypeCheckerTransitionFunction<ElementNode>,
  [ASTNodeType.If]: TypeCheckerTransitionFunction<IfNode>,
  [ASTNodeType.For]: TypeCheckerTransitionFunction<ForNode>,
  [ASTNodeType.Switch]: TypeCheckerTransitionFunction<SwitchNode>
  [ASTNodeType.Import]: TypeCheckerTransitionFunction<ImportNode>,
  [ASTNodeType.Template]: TypeCheckerTransitionFunction<TemplateNode>,
  [ASTNodeType.Render]: TypeCheckerTransitionFunction<RenderNode>,
  [ASTNodeType.Let]: TypeCheckerTransitionFunction<LetNode>
} & 
{ 
  [K in OmittedKeys]?: undefined 
}