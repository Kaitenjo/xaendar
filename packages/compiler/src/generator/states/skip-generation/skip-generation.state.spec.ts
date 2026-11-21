import { describe, expect, it } from 'vitest';
import { ASTNode } from '../../../parser/types/ast.type';
import type { ContextCache } from '../../../types/context-cache.type';
import { GeneratorContext } from '../../context/context';
import { skipGeneration } from './skip-generation.state';

const cache = {} as ContextCache;

describe('skipGeneration', () => {
  it('generates nothing', async () => {
    expect(await skipGeneration({} as ASTNode, 'root', '0', new GeneratorContext(cache))).toBeUndefined();
  });
});
