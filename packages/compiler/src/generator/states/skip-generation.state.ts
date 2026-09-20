import { ASTNode } from '../../parser/types/ast.type';
import { CompilerContext } from '../models/compiler-context.model';

export async function skipGeneration(_node: ASTNode, _parentNode: string, _index: string, _compilerContext: CompilerContext): Promise<undefined> {
  return;
}
