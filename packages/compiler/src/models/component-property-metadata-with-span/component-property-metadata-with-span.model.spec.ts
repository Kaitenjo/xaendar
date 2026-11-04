import { createSourceFile, ScriptTarget } from 'typescript';
import { describe, expect, it } from 'vitest';
import { ComponentPropertyMetadataWithSpan } from './component-property-metadata-with-span.model';

describe('ComponentPropertyMetadataWithSpan', () => {
  it('keeps the span and the source file of the property, with its metadata', () => {
    const sourceFile = createSourceFile('/src/a.ts', '', ScriptTarget.Latest);
    const span = { start: 1, end: 5 };

    const property = new ComponentPropertyMetadataWithSpan(span, sourceFile, 'name', 'string', { required: true, alias: 'n' });

    expect(property.span).toBe(span);
    expect(property.sourceFile).toBe(sourceFile);
    expect(property).toMatchObject({ name: 'name', type: 'string', required: true, alias: 'n' });
  });
});
