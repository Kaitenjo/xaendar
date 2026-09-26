import { describe, expect, it } from 'vitest';
import { ASTNode } from '../../../parser/types/ast.type';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { skipGeneration } from './skip-generation.state';

describe('skipGeneration', () => {
  it('generates nothing', async () => {
    expect(await skipGeneration({} as ASTNode, 'root', '0', new CompilerContext())).toBeUndefined();
  });
});
