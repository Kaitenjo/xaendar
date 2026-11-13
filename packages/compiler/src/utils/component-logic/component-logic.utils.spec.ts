import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSourceFile, getDecorators, isClassDeclaration, ScriptTarget } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ComponentDeclaration } from '../../types/component-declaration.type';
import type { ClassDeclarationWithName } from '../../types/typescript-decorator-nodes/class-declaration-with-name.type';
import type { WebComponentDecorator } from '../../types/typescript-decorator-nodes/web-component-decorator.type';
import { findComponentLogic, findModuleLogic } from './component-logic.utils';

const IMPORTS = [
  'import { CustomElement, getTransferState, HostProperty, Property, WebComponent } from \'@xaendar/core\';',
  'import { computed, effect, signal } from \'@xaendar/core/signals\';'
].join('\n');

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'xaendar-logic-'));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

/**
 * Reads the declaration of the last class of a source: the component.
 */
const declarationOf = (source: string, fileName = '/src/a.xd.component.ts'): ComponentDeclaration => {
  const sourceFile = createSourceFile(fileName, source, ScriptTarget.Latest, true);
  const klass = sourceFile.statements.filter(isClassDeclaration).at(-1) as unknown as ClassDeclarationWithName;
  return { klass, decorator: getDecorators(klass as never)![0] as unknown as WebComponentDecorator };
};

/**
 * Finds the logic of a component declared with a class body, after some module-level code.
 */
const logicOf = (body: string, header = '', options = 'selector: \'x-a\', templateUrl: \'./a.html\''): string | undefined =>
  findComponentLogic(declarationOf(`${IMPORTS}\n${header}\n@WebComponent({ ${options} })\nexport class A extends CustomElement {\n${body}\n}`));

describe('findComponentLogic', () => {
  it.each([
    ['nothing', ''],
    ['an input', '@Property(\'\') public accessor label!: InputSignal<string>;'],
    ['a required input', '@Property.required() public accessor label!: InputSignal<string>;'],
    ['a host property', '@HostProperty(\'class.on\') public get on(): boolean { return true; }'],
    ['a field without a value', 'public a?: string;'],
    ['a constructor only calling super', 'constructor() { super(); }'],
    ['a constructor without a body', 'constructor();'],
    ['a method reading a parameter named like a global', 'public format(name: string): string { return name; }'],
    ['a method declaring a variable named like a global', 'public format(): number { const { length } = \'a\'; const status = length; return status; }'],
    ['a method calling a function of the application', 'public format(value: number): string { return format(value); }'],
    ['the names of members named like a global', 'public format(user: { name: string }): object { return { name: user.name }; }'],
    ['types named like a global', 'public format(value: unknown): Location { return value as Location; }'],
    ['an abstract method', 'public format?(): string;'],
    ['a setter', 'public set value(value: string) { console.log(value); }'],
    ['an index signature', '[key: string]: unknown;'],
    ['a stray semicolon', ';']
  ])('finds no logic in %s', (_case, body) => {
    expect(logicOf(body, 'import { format } from \'./format\';')).toBeUndefined();
  });

  it.each([
    ['a string', '\'a\''],
    ['a template without expressions', '`a`'],
    ['a template', '`a${1}`'],
    ['a number', '1'],
    ['a bigint', '1n'],
    ['a regular expression', '/a/'],
    ['true', 'true'],
    ['false', 'false'],
    ['null', 'null'],
    ['undefined', 'undefined'],
    ['a negative number', '-1'],
    ['a sum', '1 + 2'],
    ['a condition', 'true ? 1 : 2'],
    ['parentheses', '(1)'],
    ['a cast', '1 as number'],
    ['a satisfies', '1 satisfies number'],
    ['a non-null assertion', 'LIMIT!'],
    ['an old cast', '<number>1'],
    ['a typeof', 'typeof LIMIT'],
    ['an array', '[1, ...[2]]'],
    ['an object', '{ a: 1, ...{ b: 2 }, LIMIT }'],
    ['a constant', 'LIMIT'],
    ['a member', 'SIZES.small'],
    ['an index', 'SIZES[\'small\']'],
    ['another field', 'this.other'],
    ['a function of ECMAScript', 'Math.max(1, 2)'],
    ['a class of ECMAScript', 'new Date(0)'],
    ['a class of ECMAScript without parentheses', 'new Date'],
    ['a computed', 'computed(() => this.other)'],
    ['the transfer state', 'getTransferState(\'a\')'],
    ['an arrow function', '(value: number) => value + 1'],
    ['a function', 'function (value: number) { return value + 1; }']
  ])('accepts a field holding %s', (_case, initializer) => {
    expect(logicOf(`public other = 1;\npublic a = ${initializer};`, 'const LIMIT = 1;\nconst SIZES = { small: 1 };')).toBeUndefined();
  });

  it.each([
    ['@Event', '@Event() public accessor picked!: Output<void>;', 'declares @Event'],
    ['@Query', '@Query(\'a\') public accessor a!: QuerySignal<Element>;', 'declares @Query'],
    ['@HostListener', '@HostListener(\'click\') public onClick(): void { }', 'declares @HostListener'],
    ['a decorator without arguments', '@Marked public a = 1;', 'declares @Marked'],
    ['onInit', 'public onInit(): void { }', 'declares onInit'],
    ['afterRender', 'public afterRender(): void { }', 'declares afterRender'],
    ['onDestroy', 'public onDestroy(): void { }', 'declares onDestroy'],
    ['a constructor running code', 'constructor() { super(); this.title = \'a\'; }', 'runs code in its constructor'],
    ['a static block', 'static { console.log(1); }', 'runs code in a static block'],
    ['a signal', 'public count = signal(0);', 'creates the signal count'],
    ['a function of the application', 'public a = format(1);', 'runs code to initialize a'],
    ['a class of the application', 'public a = new Format();', 'runs code to initialize a'],
    ['a method of a value', 'public a = \'a\'.toUpperCase();', 'runs code to initialize a'],
    ['a function reached from a call', 'public a = format()();', 'runs code to initialize a'],
    ['a value changed by the initializer', 'public a = ++LIMIT;', 'runs code to initialize a'],
    ['a decrement', 'public a = --LIMIT;', 'runs code to initialize a'],
    ['an assignment', 'public a = LIMIT = 2;', 'runs code to initialize a'],
    ['an increment after the value', 'public a = LIMIT++;', 'runs code to initialize a'],
    ['an object with a method', 'public a = { format() { } };', 'runs code to initialize a'],
    ['an arrow function reading a global', 'public a = () => window;', 'runs code to initialize a'],
    ['a signal of a module', 'public a = count;', 'runs code to initialize a'],
    ['this.effect', 'public start(): void { this.effect(() => undefined); }', 'calls effect'],
    ['this.createComponent', 'public start(): void { this.createComponent(); }', 'calls createComponent'],
    ['effect', 'public start(): void { effect(() => undefined); }', 'calls effect'],
    ['a global only the browser has', 'public get width(): number { return innerWidth; }', 'reads the global innerWidth'],
    ['a global guarded by typeof', 'public get on(): boolean { return typeof document !== \'undefined\'; }', 'reads the global document'],
    ['a signal of a module in a method', 'public get total(): number { return count(); }', 'reads a signal of a module']
  ])('finds %s', (_case, body, logic) => {
    const header = [
      'import { format, Format } from \'./format\';',
      'import * as store from \'./store\';',
      'let LIMIT = 1;',
      'const count = signal(0);'
    ].join('\n');

    expect(logicOf(body, header)).toBe(logic);
  });

  it.each([
    ['the host directives', 'hostDirectives: [Tip]', 'declares host directives'],
    ['a trigger', 'ssr: { hydrate: \'idle\' }', 'declares the ssr option'],
    ['the opt-out', 'ssr: { static: false }', 'declares the ssr option'],
    ['an expression', 'ssr: SSR', 'declares the ssr option'],
    ['a shorthand', 'ssr', 'declares the ssr option']
  ])('finds %s in the options', (_case, option, logic) => {
    expect(logicOf('', '', `selector: 'x-a', ${option}, templateUrl: './a.html'`)).toBe(logic);
  });

  it('accepts an empty ssr option', () => {
    expect(logicOf('', '', 'selector: \'x-a\', ssr: { }, templateUrl: \'./a.html\'')).toBeUndefined();
  });

  it('reads no option out of an expression', () => {
    expect(findComponentLogic(declarationOf('@WebComponent(OPTIONS) class A extends CustomElement { }'))).toBe('declares its options through an expression');
  });

  describe('the classes a component inherits from', () => {
    const write = (name: string, source: string): string => {
      const file = join(root, name);
      mkdirSync(root, { recursive: true });
      writeFileSync(file, source);
      return file;
    };

    it('ends at CustomElement, imported under any name, and at a class extending nothing', () => {
      expect(findComponentLogic(declarationOf('import { CustomElement as Element } from \'@xaendar/core\';\n@WebComponent({ }) class A extends Element { }'))).toBeUndefined();
      expect(findComponentLogic(declarationOf('@WebComponent({ }) class A { }'))).toBeUndefined();
    });

    it('tells CustomElement of @xaendar/core from the names of other imports of the package', () => {
      const header = 'import * as core from \'@xaendar/core\';\nimport Default from \'@xaendar/core/signals\';\nimport \'@xaendar/core/types\';';

      expect(findComponentLogic(declarationOf(`${header}\n@WebComponent({ }) class A extends CustomElement { }`))).toBe('extends CustomElement, whose code cannot be read');
    });

    it('reads the classes of the same file', () => {
      const header = 'import { CustomElement } from \'@xaendar/core\';';

      expect(findComponentLogic(declarationOf(`${header}\nclass Base extends CustomElement { }\n@WebComponent({ }) class A extends Base { }`))).toBeUndefined();
      expect(findComponentLogic(declarationOf(`${header}\nclass Base extends CustomElement { public onInit(): void { } }\n@WebComponent({ }) class A extends Base { }`))).toBe('declares onInit');
    });

    it('reads the classes of other files', () => {
      write('base.ts', 'export class Base { public afterRender(): void { } }\n');

      expect(findComponentLogic(declarationOf('import { Base } from \'./base\';\n@WebComponent({ }) class A extends Base { }', join(root, 'a.ts')))).toBe('declares afterRender');
    });

    it('finds a signal read through a namespace of another file', () => {
      write('store.ts', `${IMPORTS}\nexport const count = signal(0);\n`);
      const source = 'import * as store from \'./store\';\n@WebComponent({ }) class A { public a = store.count; }';

      expect(findComponentLogic(declarationOf(source, join(root, 'c.ts')))).toBe('runs code to initialize a');
    });

    it('stops at a class it cannot read', () => {
      write('compiled.d.ts', 'export declare class Compiled { }\n');

      expect(findComponentLogic(declarationOf('import { Compiled } from \'./compiled\';\n@WebComponent({ }) class A extends Compiled { }', join(root, 'b.ts')))).toBe('extends Compiled, whose code cannot be read');
      expect(findComponentLogic(declarationOf('@WebComponent({ }) class A extends mixin(Base) { }'))).toBe('extends mixin(Base), whose code cannot be read');
    });

    it('ends at a chain going back to itself', () => {
      expect(findComponentLogic(declarationOf('class B extends A { }\n@WebComponent({ }) class A extends B { }'))).toBeUndefined();
    });
  });
});

describe('findModuleLogic', () => {
  const logicOfModule = (source: string): string | undefined => findModuleLogic(createSourceFile('/src/a.ts', source, ScriptTarget.Latest, true));

  it('finds nothing in a module that only declares', () => {
    expect(logicOfModule([
      'import { a } from \'./a\';',
      'import type { B } from \'./b\';',
      'const LIMIT = 1;',
      'let later;',
      'class A { }',
      'function f() { }',
      'interface I { }',
      'type T = string;',
      'enum E { }',
      'export { a };',
      'export default A;'
    ].join('\n'))).toBeUndefined();
  });

  it('finds an import written for its effects', () => {
    expect(logicOfModule('import \'./polyfill\';')).toBe('imports \'./polyfill\' for its effects');
  });

  it('finds what runs when the module is evaluated', () => {
    expect(logicOfModule('console.log(1);')).toBe('runs code when its module is evaluated');
    expect(logicOfModule('const a = start();')).toBe('runs a when its module is evaluated');
  });
});
