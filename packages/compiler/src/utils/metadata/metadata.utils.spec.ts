import { createSourceFile, ScriptTarget, SourceFile, SyntaxKind } from 'typescript';
import { describe, expect, it } from 'vitest';
import { extractComponentsMetadataFromSourceFile } from './metadata.utils';

const sourceFileOf = (code: string): SourceFile => createSourceFile('component.ts', code, ScriptTarget.Latest, true);
const extract = (code: string) => extractComponentsMetadataFromSourceFile(sourceFileOf(code));
const component = (body = '', decorator = '@WebComponent({ selector: \'my-el\', templateUrl: \'./t.xaendar\' })') => `${decorator}\nclass MyEl {\n${body}\n}`;

describe('extractComponentsMetadataFromSourceFile', () => {
  describe('component declarations', () => {
    it('extracts selectors, template and style urls', async () => {
      const metadata = (await extract(component('', '@WebComponent({ selector: [\'a-b\', \'c-d\', 5], templateUrl: \'./t.xaendar\', styleUrl: \'./s.css\' })')))?.get('MyEl');

      expect(metadata).toMatchObject({
        type: 'component',
        className: 'MyEl',
        selectors: ['a-b', 'c-d'],
        templateUrl: './t.xaendar',
        styleUrl: './s.css'
      });
      expect(metadata?.properties.size).toBe(0);
      expect(metadata?.events.size).toBe(0);
    });

    it('supports namespaced decorators and multiple components per file', async () => {
      const result = await extract(`
        @Other()
        @xaendar.WebComponent({ selector: 'a-a', templateUrl: './a.xaendar' })
        class A {}

        @WebComponent({ selector: 'b-b', templateUrl: './b.xaendar' })
        class B {}
      `);

      expect([...result!.keys()]).toEqual(['A', 'B']);
    });

    it('ignores non-components', async () => {
      const result = await extract(`
        const value = 1;
        class Plain {}
        @Other() class Decorated {}
        @WebComponent class NotCalled {}
        @other.Namespace() class OtherNamespace {}
        @WebComponent({ selector: 'x-y', templateUrl: 'x' }) export default class {}
      `);

      expect(result?.size).toBe(0);
    });

    it.each([
      ['no arguments', '@WebComponent()'],
      ['a non-object argument', '@WebComponent(\'x\')'],
      ['no selector', '@WebComponent({ templateUrl: \'./t\' })'],
      ['a non-literal selector', '@WebComponent({ selector: selector, templateUrl: \'./t\' })'],
      ['no template url', '@WebComponent({ selector: \'a-b\' })'],
      ['a non-literal template url', '@WebComponent({ selector: \'a-b\', templateUrl: url })'],
      ['unsupported properties only', '@WebComponent({ \'selector\': \'a-b\', shorthand, other: 1, styleUrl: style })']
    ])('returns undefined when the decorator has %s', async (_name, decorator) => {
      expect(await extract(component('', decorator))).toBeUndefined();
    });

    it('returns undefined when reading the decorator fails', async () => {
      const identifier = { kind: SyntaxKind.Identifier, text: 'WebComponent' };
      const call = { kind: SyntaxKind.CallExpression, expression: identifier, get arguments(): never { throw new Error('boom'); } };
      const klass = {
        kind: SyntaxKind.ClassDeclaration,
        name: { kind: SyntaxKind.Identifier, text: 'Broken' },
        modifiers: [{ kind: SyntaxKind.Decorator, expression: call }],
        members: []
      };

      expect(await extractComponentsMetadataFromSourceFile({ statements: [klass] } as unknown as SourceFile)).toBeUndefined();
    });
  });

  describe('properties', () => {
    it('extracts types, default values, requirement and aliases', async () => {
      const properties = (await extract(component(`
        @Property('x', { alias: 'a' }) accessor foo!: InputSignal<string>;
        @Property() accessor plain!: string;
        @Property('y') accessor noOptions!: Foo;
        @Property('z', { other: 1 }) accessor otherOption;
        @Property('w', { alias: someVar }) accessor dynamicAlias!: Signal<number>;
        @Property('v', someVar) accessor notAnObject!: Signal<number>;
        @Property.required() accessor bar!: Signal<number>;
        @Property.required({ alias: 'r' }) accessor baz!: Signal<boolean>;
      `)))?.get('MyEl')?.properties;

      expect([...properties!.keys()]).toEqual(['a', 'plain', 'noOptions', 'otherOption', 'dynamicAlias', 'notAnObject', 'bar', 'r']);
      expect(properties?.get('a')).toMatchObject({ name: 'foo', type: 'string', alias: 'a', defaultValue: '\'x\'', required: false });
      expect(properties?.get('plain')).toMatchObject({ type: 'any', defaultValue: undefined });
      expect(properties?.get('noOptions')).toMatchObject({ type: 'any', defaultValue: '\'y\'' });
      expect(properties?.get('otherOption')).toMatchObject({ type: 'any', alias: undefined });
      expect(properties?.get('bar')).toMatchObject({ type: 'number', required: true });
      expect(properties?.get('r')).toMatchObject({ name: 'baz', type: 'boolean', required: true, alias: 'r' });
    });

    it('ignores members that are not decorated properties', async () => {
      const metadata = (await extract(component(`
        method() {}
        undecorated = 1;
        @Other() other!: string;
        @Property accessor bare!: string;
        @Property() ['computed']: string;
        @Property() 'literal'!: string;
        @Property() public modified!: string;
      `)))?.get('MyEl');

      expect([...metadata!.properties.keys()]).toEqual(['modified']);
    });

    it('throws when two properties resolve to the same name', async () => {
      await expect(extract(component(`
        @Property('x', { alias: 'b' }) accessor a!: string;
        @Property() accessor b!: string;
      `))).rejects.toContain('A property identified by name b was already defined');
    });
  });

  describe('events', () => {
    it('extracts event types', async () => {
      const events = (await extract(component(`
        @Event() accessor done!: OutputEvent<boolean>;
        @Event accessor bare;
        @Event() accessor untyped!: Foo;
        @Event() ['computed']!: OutputEvent<number>;
        @Other() accessor other!: OutputEvent<number>;
      `)))?.get('MyEl')?.events;

      expect(Object.fromEntries(events!)).toEqual({
        done: { type: 'boolean' },
        bare: { type: 'void' },
        untyped: { type: 'void' }
      });
    });
  });
});
