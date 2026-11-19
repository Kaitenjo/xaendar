import { extractComponentsMetadataFromSourceFile, type ComponentMetadata } from '@xaendar/compiler';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProgram, createSourceFile, ModuleKind, ModuleResolutionKind, ScriptTarget, type Program } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { isSerializableInput } from './serializable-input.utils';

const STUBS = [
  'declare const INCOMING_VALUE: unique symbol;',
  'type InputSignal<T, In = T> = (() => T) & { readonly [INCOMING_VALUE]?: () => In };',
  'declare function Property(...args: any[]): any;',
  'declare function WebComponent(options: object): any;',
  'class Shape { public area = 1; }',
  'interface Point { x: number; y?: string }',
  'interface Tree { value: number; children: Tree[] }',
  'type Row = { id: number, tags: string[], on?: boolean };',
  'enum Size { Small, Large }'
].join('\n');

let root: string;
let counter = 0;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'xaendar-serializable-'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

/**
 * Builds the program of a component declaring an input of a type.
 */
const compileInput = async (type: string, members = `@Property() public accessor value!: InputSignal<${type}>;`): Promise<{ program: Program, metadata: ComponentMetadata }> => {
  const fileName = join(root, `case-${counter++}.xd.component.ts`).replaceAll('\\', '/');
  const source = `${STUBS}\n@WebComponent({ selector: 'x-a', templateUrl: './a.html' })\nexport class A {\n${members}\n}\n`;
  writeFileSync(fileName, source);
  const program = createProgram([fileName], { target: ScriptTarget.ESNext, module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler, strict: true, skipLibCheck: true, noEmit: true });
  const metadatas = await extractComponentsMetadataFromSourceFile(createSourceFile(fileName, source, ScriptTarget.Latest, true));
  return { program, metadata: metadatas!.get('A')! };
};

/**
 * Tells whether an input of a type can be written into the HTML.
 */
const isSerializable = async (type: string): Promise<boolean> => {
  const { program, metadata } = await compileInput(type);
  return isSerializableInput(program, metadata, 'value');
};

describe('isSerializableInput', () => {
  it.each([
    'string', 'number', 'boolean', 'bigint', 'undefined', 'null', '\'a\' | \'b\'', '1', 'true', 'string | undefined', 'Size',
    'string[]', 'readonly string[]', '[number, string]', 'Date', 'Map<string, number>', 'Set<number>', 'Date[]',
    '{ id: number }', 'Point', 'Row', 'Row[]', 'Tree', 'Record<string, number>', '{ a: { b: string[] } }', 'Point & Row', '{ }'
  ])('accepts %s', async type => {
    expect(await isSerializable(type)).toBe(true);
  }, 30_000);

  it.each([
    'any', 'unknown', 'never', 'symbol', 'object', 'Function', '() => void', '{ onSave(): void }', '{ onSave: () => void }',
    'Shape', 'Shape[]', 'string | Shape', 'Promise<string>', 'typeof Shape', 'Map<string, () => void>', 'Set<Shape>',
    'Record<string, () => void>', 'HTMLElement', 'RegExp'
  ])('rejects %s', async type => {
    expect(await isSerializable(type)).toBe(false);
  }, 30_000);

  it('reads the input by the alias it is written with', async () => {
    const { program, metadata } = await compileInput('', '@Property(\'\', { alias: \'kind\' }) public accessor value!: InputSignal<string>;');

    expect(isSerializableInput(program, metadata, 'kind')).toBe(true);
  }, 30_000);

  it('rejects an exposed input of a host directive, which does not exist on the server', async () => {
    const { program, metadata } = await compileInput('string');
    metadata.properties.get('value')!.exposed = true;

    expect(isSerializableInput(program, metadata, 'value')).toBe(false);
  }, 30_000);

  it('reads the type the input accepts from outside, before its transform, which data-xd-inputs holds', async () => {
    const url = await compileInput('', '@Property(undefined, { transform: (url: URL) => url.href }) public accessor value!: InputSignal<string, URL>;');
    const text = await compileInput('', '@Property(undefined, { transform: (href: string) => new URL(href) }) public accessor value!: InputSignal<URL, string>;');

    expect(isSerializableInput(url.program, url.metadata, 'value')).toBe(false);
    expect(isSerializableInput(text.program, text.metadata, 'value')).toBe(true);
  }, 30_000);

  it('reads the value of a signal without the type it accepts from outside', async () => {
    const { program, metadata } = await compileInput('', '@Property() public accessor value!: () => string;');

    expect(isSerializableInput(program, metadata, 'value')).toBe(true);
  }, 30_000);

  it('rejects an input of a class outside of the program, or a value that is not a signal', async () => {
    const { program, metadata } = await compileInput('string', '@Property() public accessor value!: string;');
    const { metadata: other } = await compileInput('string');

    expect(isSerializableInput(program, metadata, 'value')).toBe(false);
    expect(isSerializableInput(program, other, 'value')).toBe(false);
  }, 30_000);

  it('rejects a class of the program that does not declare the property', async () => {
    const { program, metadata } = await compileInput('string');
    metadata.properties.get('value')!.name = 'missing';

    expect(isSerializableInput(program, metadata, 'value')).toBe(false);
  }, 30_000);
});
