import { ASTNode } from '../../../parser/types/ast.type';
import { GeneratorContext } from '../../context/context';

export async function skipGeneration(_node: ASTNode, _parentNode: string, _index: string, _generatorContext: GeneratorContext): Promise<undefined> {
  return;
}
