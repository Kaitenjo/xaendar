import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSourceFile, ModuleKind, ModuleResolutionKind, ScriptTarget, SourceFile, SyntaxKind } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ComponentOrDirectiveMetadata } from '../../types/component-or-directive-metadata.type';
import { describeSelectorConflict, extractComponentsMetadataFromSourceFile, extractDirectivesMetadataFromSourceFile, findWebComponentErrors, getOwnerType } from './metadata.utils';

const sourceFileOf = (code: string): SourceFile => createSourceFile('component.ts', code, ScriptTarget.Latest, true);
const extract = (code: string) => extractComponentsMetadataFromSourceFile(sourceFileOf(code));
const component = (body = '', decorator = '@WebComponent({ selector: \'my-el\', templateUrl: \'./t.xaendar\' })') => `${decorator}\nclass MyEl {\n${body}\n}`;
const propertyType = (className: string, member: string, module = 'component') => `ReturnType<import('${module}').${className}['${member}']>`;
const eventType = (className: string, member: string) => `(import('component').${className}['${member}'] extends import('@xaendar/core').Output<infer Value> ? Value : never)`;

describe('extractComponentsMetadataFromSourceFile', () => {
  describe('component declarations', () => {
    it('extracts selector, template and style urls', async () => {
      const metadata = (await extract(component('', '@WebComponent({ selector: \'a-b\', templateUrl: \'./t.xaendar\', styleUrl: \'./s.css\' })')))?.get('MyEl');

      expect(metadata).toMatchObject({
        type: 'component',
        className: 'MyEl',
        selector: 'a-b',
        templateUrl: './t.xaendar',
        styleUrl: './s.css'
      });
      expect(metadata?.properties.size).toBe(0);
      expect(metadata?.events.size).toBe(0);
    });

    it.each([
      ['render: false', 'ssr: { render: false }', {}],
      ['render: false with its trigger', 'ssr: { hydrate: \'idle\', render: false }', { hydrate: 'idle' }],
      ['a trigger that is not a literal', 'ssr: { hydrate: TRIGGER, render: false }', {}],
      ['a spread next to render: false', 'ssr: { ...BASE, render: false }', {}]
    ])('reads that the component renders only in the browser from %s', async (_name, ssr, clientOnly) => {
      const metadata = (await extract(component('', `@WebComponent({ selector: 'a-b', ${ssr}, templateUrl: './t' })`)))?.get('MyEl');

      expect(metadata?.clientOnly).toEqual(clientOnly);
    });

    it.each([
      ['a trigger', 'ssr: { hydrate: \'idle\' }'],
      ['the opt-out of the analysis', 'ssr: { static: false }'],
      ['render set to another value', 'ssr: { render: true }'],
      ['an expression', 'ssr: SSR']
    ])('reads that the server renders the component from %s', async (_name, ssr) => {
      const metadata = (await extract(component('', `@WebComponent({ selector: 'a-b', ${ssr}, templateUrl: './t' })`)))?.get('MyEl');

      expect(metadata?.clientOnly).toBeUndefined();
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
      ['an array of selectors', '@WebComponent({ selector: [\'a-b\', \'c-d\'], templateUrl: \'./t\' })'],
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
    it('extracts types, requirement and aliases', async () => {
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
      expect(properties?.get('a')).toMatchObject({ name: 'foo', type: propertyType('MyEl', 'foo'), alias: 'a', required: false });
      expect(properties?.get('plain')).toMatchObject({ type: 'any' });
      expect(properties?.get('noOptions')).toMatchObject({ type: 'any', alias: undefined });
      expect(properties?.get('otherOption')).toMatchObject({ type: 'any', alias: undefined });
      expect(properties?.get('bar')).toMatchObject({ type: propertyType('MyEl', 'bar'), required: true });
      expect(properties?.get('r')).toMatchObject({ name: 'baz', type: propertyType('MyEl', 'baz'), required: true, alias: 'r' });
    });

    it('references the types through the accessors of the class, from the module declaring it', async () => {
      const sourceFile = createSourceFile('C:\\src\\my-el.xd.component.ts', component('@Property(\'ts\') accessor lang!: InputSignal<CodeLang>;'), ScriptTarget.Latest, true);
      const properties = (await extractComponentsMetadataFromSourceFile(sourceFile))?.get('MyEl')?.properties;

      expect(properties?.get('lang')?.type).toBe(propertyType('MyEl', 'lang', 'C:/src/my-el.xd.component'));
    });

    describe('with a transform', () => {
      const sourceFile = createSourceFile('C:\\src\\my-el.xd.component.ts', `
        import Def from './def';
        import * as ns from '../lib/ns';
        import { Tag as Label } from './tag.type';
        import { Kind } from '@scope/kinds';
        import './side-effect';
        import type { Named } from './named';
        interface Local {}
        type Alias = string;
        class Klass {}
        enum Mode {}
        const value = 1;
        ${component(`
          @Property(0, { transform: (value: string) => Number(value) }) accessor annotated!: InputSignal<number>;
          @Property<InputSignal<number, boolean>>(0, { transform: (value: boolean) => Number(value) }) accessor generic!: InputSignal<number, boolean>;
          @Property(0, { transform: value => Number(value) }) accessor declaredOnly!: InputSignal<number, string>;
          @Property(0, { transform: (value: string) => Number(value) }) accessor untyped;
          @Property(0, { transform: value => Number(value) }) accessor bare!: InputSignal<number>;
          @Property(0, { transform(value: string[]) { return value.length; }, alias: 'tags' }) accessor method!: InputSignal<number>;
          @Property(0, { transform: function (value: Label | Local) { return 1; } }) accessor local!: InputSignal<number>;
          @Property(0, { transform: (value: Def | ns.Item | Array<Unknown>) => 1 }) accessor imports!: InputSignal<number>;
          @Property(0, { transform: (value: Kind.A | Alias | Klass | Mode | Other) => 1 }) accessor declared!: InputSignal<number>;
          @Property(0, { transform: Number }) accessor reference!: InputSignal<number>;
          @Property.required({ transform: (value: string) => Number(value) }) accessor required!: InputSignal<number>;
        `)}
      `, ScriptTarget.Latest, true);
      const properties = async () => (await extractComponentsMetadataFromSourceFile(sourceFile))?.get('MyEl')?.properties;
      const module = 'C:/src/my-el.xd.component';

      it('exposes the type annotated on the parameter of the transform', async () => {
        expect((await properties())?.get('annotated')?.type).toBe('string');
        expect((await properties())?.get('required')?.type).toBe('string');
        expect((await properties())?.get('untyped')?.type).toBe('string');
      });

      it('prefers the second type argument of the type of the accessor', async () => {
        expect((await properties())?.get('generic')?.type).toBe('boolean');
        expect((await properties())?.get('declaredOnly')?.type).toBe('string');
      });

      it('falls back on the type of the signal when no type is declared', async () => {
        expect((await properties())?.get('bare')?.type).toBe(propertyType('MyEl', 'bare', module));
        expect((await properties())?.get('reference')?.type).toBe(propertyType('MyEl', 'reference', module));
      });

      it('supports a transform declared as a method, next to an alias', async () => {
        expect((await properties())?.get('tags')).toMatchObject({ name: 'method', type: 'string[]', alias: 'tags' });
      });

      it('references the names of the type from the module declaring them', async () => {
        expect((await properties())?.get('local')?.type).toBe(`import('C:/src/tag.type').Tag | import('${module}').Local`);
        expect((await properties())?.get('declared')?.type).toBe(`import('@scope/kinds').Kind.A | import('${module}').Alias | import('${module}').Klass | import('${module}').Mode | Other`);
        expect((await properties())?.get('imports')?.type).toBe('import(\'C:/src/def\').default | import(\'C:/lib/ns\').Item | Array<Unknown>');
      });
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
        @Event() accessor empty!: OutputEvent<void>;
        @Event() ['computed']!: OutputEvent<number>;
        @Other() accessor other!: OutputEvent<number>;
      `)))?.get('MyEl')?.events;

      expect([...events!.keys()]).toEqual(['done', 'bare', 'untyped', 'empty']);
      expect(Object.fromEntries(events!)).toMatchObject({
        done: { type: eventType('MyEl', 'done') },
        bare: { type: 'void' },
        untyped: { type: 'void' },
        empty: { type: 'void' }
      });
    });
  });

  describe('inheritance', () => {
    const subclass = (heritage: string, body = '') => `@WebComponent({ selector: 'my-el', templateUrl: './t.xaendar' })\nclass MyEl ${heritage} {\n${body}\n}`;

    it('inherits the properties and events of the whole inheritance chain, referenced through the class', async () => {
      const metadata = (await extract(`
        class Root { @Property.required() accessor id!: InputSignal<number>; }
        class Base extends Root {
          @Property('x', { alias: 'caption' }) accessor label!: InputSignal<string>;
          @Event() accessor picked!: Output<number>;
        }
        ${subclass('extends Base', '@Event() accessor done!: Output<boolean>;')}
      `))?.get('MyEl');

      expect([...metadata!.properties.keys()]).toEqual(['id', 'caption']);
      expect(metadata?.properties.get('id')).toMatchObject({ name: 'id', type: propertyType('MyEl', 'id'), required: true });
      expect(metadata?.properties.get('caption')).toMatchObject({ name: 'label', type: propertyType('MyEl', 'label'), alias: 'caption' });
      expect(Object.fromEntries(metadata!.events)).toMatchObject({ picked: { type: eventType('MyEl', 'picked') }, done: { type: eventType('MyEl', 'done') } });
    });

    it('tells where each property and event is declared, in the class or in a base class', async () => {
      const code = `
        class Base {
          @Property('x', { alias: 'caption' }) accessor label!: InputSignal<string>;
          @Event() accessor picked!: Output<number>;
        }
        ${subclass('extends Base', '@Property() accessor size!: InputSignal<number>;\n@Event() accessor done!: Output<boolean>;')}
      `;
      const metadata = (await extract(code))?.get('MyEl');
      const nameAt = ({ start, end }: { start: number, end: number }) => code.slice(start, end);

      // An aliased property is declared by its accessor, not by its alias
      expect(metadata?.properties.get('caption')?.declaration).toEqual({ fileName: 'component.ts', span: expect.any(Object) });
      expect(nameAt(metadata!.properties.get('caption')!.declaration!.span)).toBe('label');
      expect(nameAt(metadata!.properties.get('size')!.declaration!.span)).toBe('size');
      expect(nameAt(metadata!.events.get('picked')!.declaration!.span)).toBe('picked');
      expect(nameAt(metadata!.events.get('done')!.declaration!.span)).toBe('done');
      expect(code.indexOf('label')).toBe(metadata!.properties.get('caption')!.declaration!.span.start);
    });

    it('lets the class override an inherited accessor, whatever its alias', async () => {
      const metadata = (await extract(`
        class Base {
          @Property('a', { alias: 'caption' }) accessor label!: InputSignal<string>;
          @Event() accessor picked!: Output<number>;
        }
        ${subclass('extends Base', '@Property.required() accessor label!: InputSignal<string>;\n@Event() accessor picked!: Output<void>;')}
      `))?.get('MyEl');

      expect([...metadata!.properties.keys()]).toEqual(['label']);
      expect(metadata?.properties.get('label')).toMatchObject({ required: true, alias: undefined });
      expect(Object.fromEntries(metadata!.events)).toMatchObject({ picked: { type: 'void' } });
    });

    it('throws, pointing at the inherited property, when a property of the class resolves to its name', async () => {
      await expect(extract(`
        class Base {
          @Property() accessor caption!: string;
        }
        ${subclass('extends Base', '@Property(\'a\', { alias: \'caption\' }) accessor label!: string;')}
      `)).rejects.toMatch(/component\.ts\n\[Ln 3, Col 32\] - A property identified by name caption was already defined/);
    });

    it('stops on circular inheritance and skips the base classes it cannot resolve', async () => {
      const circular = (await extract(`
        class First extends Second { @Property() accessor first!: string; }
        class Second extends First { @Property() accessor second!: string; }
        ${subclass('extends First')}
      `))?.get('MyEl');
      const unresolved = (await extract(subclass('extends Missing', '@Property() accessor own!: string;')))?.get('MyEl');

      expect([...circular!.properties.keys()]).toEqual(['second', 'first']);
      expect([...unresolved!.properties.keys()]).toEqual(['own']);
    });

    describe('base classes declared in other files', () => {
      let root: string;

      beforeAll(() => {
        root = mkdtempSync(join(tmpdir(), 'xaendar-metadata-')).replaceAll('\\', '/');
        mkdirSync(`${root}/shared`);
        writeFileSync(`${root}/shared/base.ts`, 'export class Base { @Property() accessor label!: InputSignal<string>; @Event() accessor picked!: Output<number>; }');
      });

      afterAll(() => {
        rmSync(root, { recursive: true, force: true });
      });

      it('inherits the accessors of an imported base class', async () => {
        const sourceFile = createSourceFile(`${root}/my-el.ts`, `import { Base } from './shared/base';\n${subclass('extends Base')}`, ScriptTarget.Latest, true);
        const metadata = (await extractComponentsMetadataFromSourceFile(sourceFile))?.get('MyEl');

        expect(metadata?.properties.get('label')?.type).toBe(propertyType('MyEl', 'label', `${root}/my-el`));
        expect(metadata?.events.has('picked')).toBe(true);
      });

      it('resolves the base classes with the given compiler options', async () => {
        const sourceFile = createSourceFile(`${root}/my-el.ts`, `import { Base } from '@shared/base';\n${subclass('extends Base')}`, ScriptTarget.Latest, true);
        const compilerOptions = { module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler, paths: { '@shared/*': [`${root}/shared/*`] } };

        expect((await extractComponentsMetadataFromSourceFile(sourceFile))?.get('MyEl')?.properties.size).toBe(0);
        expect((await extractComponentsMetadataFromSourceFile(sourceFile, compilerOptions))?.get('MyEl')?.properties.has('label')).toBe(true);
      });
    });
  });
});

const extractDirectives = (code: string) => extractDirectivesMetadataFromSourceFile(sourceFileOf(code));
const directive = (body = '', decorator = '@Directive({ selector: \'myDirective\' })') => `${decorator}\nclass MyDirective {\n${body}\n}`;

describe('extractDirectivesMetadataFromSourceFile', () => {
  it('extracts the selector, properties and events of a directive', async () => {
    const metadata = (await extractDirectives(directive(`
      @Property('block') accessor display!: InputSignal<'block' | 'none'>;
      @Property.required({ alias: 'is-visible' }) accessor visible!: InputSignal<boolean>;
      @Event() accessor toggled!: Output<boolean>;
    `)))?.get('MyDirective');

    expect(metadata).toMatchObject({
      type: 'directive',
      className: 'MyDirective',
      selector: 'myDirective'
    });
    expect(metadata).not.toHaveProperty('templateUrl');
    expect(metadata).not.toHaveProperty('styleUrl');
    expect(metadata?.properties.get('display')).toMatchObject({ name: 'display', type: propertyType('MyDirective', 'display'), required: false });
    expect(metadata?.properties.get('is-visible')).toMatchObject({ name: 'visible', type: propertyType('MyDirective', 'visible'), required: true });
    expect(Object.fromEntries(metadata!.events)).toMatchObject({ toggled: { type: eventType('MyDirective', 'toggled') } });
    expect(metadata?.typescriptNodes.klass.name.text).toBe('MyDirective');
  });

  it('ignores components and non-directives', async () => {
    const result = await extractDirectives(`
      @WebComponent({ selector: 'my-el', templateUrl: './t.xaendar' })
      class Component {}
      class Plain {}
      @xaendar.Directive({ selector: 'namespaced' })
      class Namespaced {}
    `);

    expect([...result!.keys()]).toEqual(['Namespaced']);
  });

  it('is ignored by the component extraction', async () => {
    expect((await extract(directive()))?.size).toBe(0);
  });

  it.each([
    ['no arguments', '@Directive()'],
    ['no selector', '@Directive({})'],
    ['a non-literal selector', '@Directive({ selector: selector })']
  ])('returns undefined when the decorator has %s', async (_name, decorator) => {
    expect(await extractDirectives(directive('', decorator))).toBeUndefined();
  });

  it('throws when two properties resolve to the same name', async () => {
    await expect(extractDirectives(directive(`
      @Property('x', { alias: 'b' }) accessor a!: string;
      @Property() accessor b!: string;
    `))).rejects.toContain('Failed to extract metadata from an imported directive in the template');
  });

  it('inherits the properties and events of its base classes', async () => {
    const metadata = (await extractDirectives(`
      class Base { @Property('block') accessor display!: InputSignal<string>; @Event() accessor toggled!: Output<boolean>; }
      ${directive('', '@Directive({ selector: \'myDirective\' })').replace('class MyDirective', 'class MyDirective extends Base')}
    `))?.get('MyDirective');

    expect(metadata?.properties.get('display')?.type).toBe(propertyType('MyDirective', 'display'));
    expect(Object.fromEntries(metadata!.events)).toMatchObject({ toggled: { type: eventType('MyDirective', 'toggled') } });
  });
});

describe('generics', () => {
  it('extracts the type parameters of a generic directive, and references its accessors through the class instantiated with them', async () => {
    const metadata = (await extractDirectives(`
      @Directive({ selector: 'list' })
      class MyDirective<Item extends { id: number }, Key = string> {
        @Property([]) accessor items!: InputSignal<Item[]>;
        @Event() accessor picked!: Output<Key>;
      }
    `))?.get('MyDirective');

    expect(metadata?.typeParameters).toEqual([{ name: 'Item', hasDefault: false }, { name: 'Key', hasDefault: true }]);
    expect(metadata?.properties.get('items')?.type).toBe('ReturnType<import(\'component\').MyDirective<Item, Key>[\'items\']>');
    expect(metadata?.events.get('picked')?.type).toBe('(import(\'component\').MyDirective<Item, Key>[\'picked\'] extends import(\'@xaendar/core\').Output<infer Value> ? Value : never)');
  });

  it('leaves the type parameters out of a directive that is not generic', async () => {
    const metadata = (await extractDirectives(directive('@Property(\'\') accessor text!: InputSignal<string>;')))?.get('MyDirective');

    expect(metadata).not.toHaveProperty('typeParameters');
    expect(metadata?.properties.get('text')?.type).toBe(propertyType('MyDirective', 'text'));
  });

  it('extracts the type parameters of a generic component, and references its accessors through the class instantiated with them', async () => {
    const metadata = (await extract(`
      @WebComponent({ selector: 'my-el', templateUrl: './t.xaendar' })
      class MyEl<Item, Key = string> {
        @Property([]) accessor items!: InputSignal<Item[]>;
      }
    `))?.get('MyEl');

    expect(metadata?.typeParameters).toEqual([{ name: 'Item', hasDefault: false }, { name: 'Key', hasDefault: true }]);
    expect(metadata?.properties.get('items')?.type).toBe('ReturnType<import(\'component\').MyEl<Item, Key>[\'items\']>');
  });

  it('leaves the type parameters out of a component that is not generic', async () => {
    const metadata = (await extract(component('@Property(\'\') accessor text!: InputSignal<string>;')))?.get('MyEl');

    expect(metadata).not.toHaveProperty('typeParameters');
    expect(metadata?.properties.get('text')?.type).toBe(propertyType('MyEl', 'text'));
  });
});

describe('findWebComponentErrors', () => {
  const errorsOf = (decorator: string, componentFile = true) => findWebComponentErrors(sourceFileOf(component('', decorator)), componentFile)?.map(({ message }) => message);

  /**
   * The text of the file each error of a decorator is reported on.
   */
  const spansOf = (decorator: string) => {
    const sourceFile = sourceFileOf(component('', decorator));

    return findWebComponentErrors(sourceFile, true)?.map(({ span }) => sourceFile.text.slice(span.start, span.end));
  };

  it('finds no error in components with literal options, nor in files without components', () => {
    const errors = errorsOf('@WebComponent({ selector: \'a-b\', templateUrl: \'./t\', styleUrl: \'./s.css\', hostDirectives: [Tooltip] })');
    expect(errors).toBeInstanceOf(Array);
    expect(errors.length).toBe(0);
  });

  it('reports each component declared in a file that does not follow the component convention', () => {
    const code = `${component()}\n@xaendar.WebComponent({ selector: 'c-d', templateUrl: './c' })\nclass Other {}`;

    expect(findWebComponentErrors(sourceFileOf(code), false)?.map(({ message }) => message)).toEqual([
      'MyEl must be declared in a file ending with .xd.component.ts',
      'Other must be declared in a file ending with .xd.component.ts'
    ]);
  });

  it.each([
    ['no arguments', '@WebComponent()'],
    ['a non-object argument', '@WebComponent(OPTIONS)']
  ])('reports options passed with %s', (_name, decorator) => {
    expect(errorsOf(decorator)).toEqual(['The options of @WebComponent in MyEl must be an object literal']);
  });

  it.each([
    ['a constant', '@WebComponent({ selector: \'a-b\', templateUrl: TEMPLATE })', 'templateUrl'],
    ['a template literal', '@WebComponent({ selector: `a-b`, templateUrl: \'./t\' })', 'selector'],
    ['a shorthand property', '@WebComponent({ selector: \'a-b\', templateUrl: \'./t\', styleUrl })', 'styleUrl']
  ])('reports an option given as %s', (_name, decorator, option) => {
    expect(errorsOf(decorator)).toEqual([`The ${option} option of MyEl must be a string literal`]);
  });

  it.each([
    ['a constant', 'ssr: SSR', 'The ssr option of MyEl must be an object literal'],
    ['a shorthand property', 'ssr', 'The ssr option of MyEl must be an object literal'],
    ['another value of render', 'ssr: { render: true }', 'The ssr.render option of MyEl must be the literal false'],
    ['a constant as render', 'ssr: { render: RENDER }', 'The ssr.render option of MyEl must be the literal false'],
    ['a shorthand render', 'ssr: { render }', 'The ssr.render option of MyEl must be the literal false'],
    ['a constant as the trigger next to render', 'ssr: { hydrate: TRIGGER, render: false }', 'The ssr.hydrate option of MyEl must be a string literal next to ssr.render'],
    ['a shorthand trigger next to render', 'ssr: { hydrate, render: false }', 'The ssr.hydrate option of MyEl must be a string literal next to ssr.render']
  ])('reports ssr given as %s', (_name, ssr, message) => {
    expect(errorsOf(`@WebComponent({ selector: 'a-b', ${ssr}, templateUrl: './t' })`)).toEqual([message]);
  });

  it.each([
    ['nothing', 'ssr: { }'],
    ['a trigger that is not a literal, without render', 'ssr: { hydrate: TRIGGER }'],
    ['render: false', 'ssr: { render: false }'],
    ['render: false with its trigger', 'ssr: { hydrate: \'idle\', render: false, static: false }']
  ])('accepts ssr declaring %s', (_name, ssr) => {
    const errors = errorsOf(`@WebComponent({ selector: 'a-b', ${ssr}, templateUrl: './t' })`);
    expect(errors).toBeInstanceOf(Array);
    expect(errors.length).toBe(0);
  });

  it('reports a selector that is not a valid custom element name', () => {
    expect(errorsOf('@WebComponent({ selector: \'card\', templateUrl: \'./t\' })')).toEqual(['Invalid custom element name "card" in component MyEl']);
  });

  it.each([
    ['an option that is not a literal, on its value', '@WebComponent({ selector: \'a-b\', templateUrl: TEMPLATE })', ['TEMPLATE']],
    ['a shorthand option, on the option', '@WebComponent({ selector: \'a-b\', templateUrl: \'./t\', styleUrl })', ['styleUrl']],
    ['an invalid selector, on its value', '@WebComponent({ selector: \'card\', templateUrl: \'./t\' })', ['\'card\'']],
    ['the options that are not an object, on the argument', '@WebComponent(OPTIONS)', ['OPTIONS']],
    ['no options, on the name of the decorator', '@WebComponent()', ['WebComponent']],
    ['a required option missing, on the name of the decorator', '@WebComponent({ selector: \'a-b\' })', ['WebComponent']],
    ['an unreadable ssr, on the option', '@WebComponent({ selector: \'a-b\', ssr: SSR, templateUrl: \'./t\' })', ['ssr: SSR']]
  ])('locates %s', (_name, decorator, spans) => {
    expect(spansOf(decorator)).toEqual(spans);
  });

  it('locates a component declared in the wrong file on the name of its class', () => {
    const sourceFile = sourceFileOf(component());
    const [{ span }] = findWebComponentErrors(sourceFile, false)!;

    expect(sourceFile.text.slice(span.start, span.end)).toBe('MyEl');
  });

  it('reports the ssr option, on the option, in a project that does not render on the server', () => {
    const sourceFile = sourceFileOf(component('', '@WebComponent({ selector: \'a-b\', ssr: { hydrate: \'idle\' }, templateUrl: \'./t\' })'));
    const [{ message, span }] = findWebComponentErrors(sourceFile, true, false);

    expect(message).toBe('The ssr option of MyEl is only for a project rendering on the server: declare "ssr" in its xaendar.json, or remove the option');
    expect(sourceFile.text.slice(span.start, span.end)).toBe('ssr: { hydrate: \'idle\' }');
  });

  it.each([
    ['renders on the server', true],
    ['may render on the server', undefined]
  ])('accepts the ssr option in a project that %s', (_description, ssr) => {
    expect(findWebComponentErrors(sourceFileOf(component('', '@WebComponent({ selector: \'a-b\', ssr: { render: false }, templateUrl: \'./t\' })')), true, ssr)).toEqual([]);
  });

  it('reports the required options that are missing, ignoring the properties it does not read', () => {
    expect(errorsOf('@WebComponent({ \'selector\': \'a-b\', ...BASE, [key]: 1, other: 1 })')).toEqual([
      'The selector option of MyEl must be a string literal',
      'The templateUrl option of MyEl must be a string literal'
    ]);
  });
});

describe('describeSelectorConflict', () => {
  const metadataOf = (type: 'component' | 'directive') => ({ type, className: 'A', selector: 'x-a', modulePath: '/a.ts' }) as unknown as ComponentOrDirectiveMetadata;

  it('names the two classes and their files', () => {
    expect(describeSelectorConflict(metadataOf('component'), { className: 'B', ownerFile: '/b.ts' })).toBe('Selector "x-a" of component "A" - /a.ts is already used by component "B" - /b.ts. Custom element names must be unique.');
    expect(describeSelectorConflict(metadataOf('directive'), { className: 'B', ownerFile: '/b.ts' })).toBe('Selector "x-a" of directive "A" - /a.ts is already used by directive "B" - /b.ts. Directive selectors must be unique.');
  });
});

describe('getOwnerType', () => {
  it('references the class through its module without the TypeScript extension, with its type parameters when asked', () => {
    const list = { className: 'List', modulePath: 'C:\\src\\list.directive.ts', typeParameters: [{ name: 'Item', hasDefault: false }, { name: 'Key', hasDefault: true }] };

    expect(getOwnerType(list, false)).toBe('import(\'C:/src/list.directive\').List');
    expect(getOwnerType(list, true)).toBe('import(\'C:/src/list.directive\').List<Item, Key>');
    expect(getOwnerType({ className: 'Card', modulePath: '/lib/card.d.ts' }, true)).toBe('import(\'/lib/card\').Card');
  });

  it('writes the type the extraction gives the accessors of the class', async () => {
    const sourceFile = createSourceFile('/src/list.directive.ts', '@Directive({ selector: \'list\' })\nexport class List<Item> {\n  @Property() accessor items!: InputSignal<Item[]>;\n}', ScriptTarget.Latest, true);
    const metadata = (await extractDirectivesMetadataFromSourceFile(sourceFile))!.get('List')!;

    expect(metadata.modulePath).toBe('/src/list.directive.ts');
    expect(metadata.properties.get('items')!.type).toBe(`ReturnType<${getOwnerType(metadata, true)}['items']>`);
  });
});
