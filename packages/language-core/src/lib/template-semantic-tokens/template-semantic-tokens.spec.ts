import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { getTemplateSemanticTokens, TEMPLATE_SEMANTIC_TOKEN_MODIFIERS, TEMPLATE_SEMANTIC_TOKEN_TYPES } from './template-semantic-tokens';

const TIMEOUT = 60_000;
let project: FixtureProject;

beforeAll(() => {
  project = createFixtureProject();
});

afterAll(() => {
  project.dispose();
});

describe('getTemplateSemanticTokens', () => {
  it('declares the legend of the tokens', () => {
    expect(TEMPLATE_SEMANTIC_TOKEN_TYPES).toEqual(['property', 'event', 'decorator', 'variable', 'function']);
    expect(TEMPLATE_SEMANTIC_TOKEN_MODIFIERS).toEqual(['readonly']);
  });

  it('colors the inputs and outputs of the components, the directives and the variables of the template, leaving the tag names to the grammar', async () => {
    const source = [
      '@import { Child } from \'./child\';',
      '@import { Tooltip, Media } from \'./directives\';',
      '<my-child label="{title}" class="a" (picked)="select($event)" (click)="select(1)" @@tooltip(text="a" (shown)="select(2)") *media(query="q")></my-child>',
      '<span title="x" (click)="select(2)" />',
      '@for (item of items; track item().id; i = $index) { { i() } { item().item } { ({ item: 1 }).item } }',
      '<my-child label="a" />',
      '@for (3) { { $index() } }'
    ].join('\n');
    const { analysis } = await project.analyze(source);

    expect(getTemplateSemanticTokens(analysis!).map(({ span, type, modifiers }) => [source.slice(span.start, span.end), type, ...modifiers])).toEqual([
      ['label', 'property'],
      ['picked', 'event'],
      ['$event', 'variable', 'readonly'],
      ['tooltip', 'decorator'],
      ['text', 'property'],
      ['shown', 'event'],
      ['media', 'decorator'],
      ['query', 'property'],
      ['item', 'variable', 'readonly'],
      ['item', 'variable', 'readonly'],
      ['i', 'variable', 'readonly'],
      ['i', 'variable', 'readonly'],
      ['item', 'variable', 'readonly'],
      ['label', 'property'],
      ['$index', 'variable', 'readonly']
    ]);
  }, TIMEOUT);

  it('colors the template variables where declared and where read, the head of a handler called on one included', async () => {
    const source = [
      '<button (click)="dialog.showModal()" (focus)="select(field)">{ field.value }</button>',
      '<input #field />',
      '<dialog #dialog></dialog>'
    ].join('\n');
    const { analysis } = await project.analyze(source);

    expect(getTemplateSemanticTokens(analysis!).map(({ span, type, modifiers }) => [source.slice(span.start, span.end), type, ...modifiers])).toEqual([
      ['dialog', 'variable', 'readonly'],
      ['field', 'variable', 'readonly'],
      ['field', 'variable', 'readonly'],
      ['field', 'variable', 'readonly'],
      ['dialog', 'variable', 'readonly']
    ]);
  }, TIMEOUT);

  it('colors the name of a template where declared and where rendered, and its parameters where declared and where read', async () => {
    const source = '@render row(title)\n<template #row(label: string)>{ label() }</template>';
    const { analysis } = await project.analyze(source);

    expect(getTemplateSemanticTokens(analysis!).map(({ span, type, modifiers }) => [source.slice(span.start, span.end), type, ...modifiers])).toEqual([
      ['row', 'function'],
      ['row', 'function'],
      ['label', 'variable', 'readonly'],
      ['label', 'variable', 'readonly']
    ]);
  }, TIMEOUT);
});
