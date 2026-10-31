import type { ASTNodeType } from '../../parser/types/node.enum';

/**
 * The AST node types the type checker has no transition function for.
 */
export type OmittedKeys = Exclude<ASTNodeType, 
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
