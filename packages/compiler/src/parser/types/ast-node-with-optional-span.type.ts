import type { CaseNode } from './nodes/case-node.type';
import type { ElementNode } from './nodes/element-node.type';
import type { ElseIfNode } from './nodes/else-if-node.type';
import type { ElseNode } from './nodes/else-node.type';
import type { ForNode } from './nodes/for-node.type';
import type { IfNode } from './nodes/if-node.type';
import type { ImportNode } from './nodes/import-node.type';
import type { InterpolationNode } from './nodes/interpolation-node.type';
import type { LetNode } from './nodes/let-node.type';
import type { RenderNode } from './nodes/render-node.type';
import type { SwitchNode } from './nodes/switch-node.type';
import type { TemplateNode } from './nodes/template-node.type';
import type { TextNode } from './nodes/text-node.type';
import type { MaybeASTNodeWithSpan } from './maybe-ast-node-with-span.type';

/**
 * Union of the AST node types, each one with its span optional.
 */
export type ASTNodeWithOptionalSpan =
| MaybeASTNodeWithSpan<ElementNode>
| MaybeASTNodeWithSpan<TextNode>
| MaybeASTNodeWithSpan<InterpolationNode>
| MaybeASTNodeWithSpan<IfNode>
| MaybeASTNodeWithSpan<ElseIfNode>
| MaybeASTNodeWithSpan<ElseNode>
| MaybeASTNodeWithSpan<ForNode>
| MaybeASTNodeWithSpan<SwitchNode>
| MaybeASTNodeWithSpan<CaseNode>
| MaybeASTNodeWithSpan<ImportNode>
| MaybeASTNodeWithSpan<TemplateNode>
| MaybeASTNodeWithSpan<RenderNode>
| MaybeASTNodeWithSpan<LetNode>;
