import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { analyzeTemplate } from '../../template-analysis/template-analysis';
import { toPosixPath } from '../../utils/path/path.utils';
import type { FixtureProject } from '../../types/fixture-project.type';

/**
 * The files of the fixture project, keyed by their path relative to its root.
 */
const FIXTURE_FILES: Readonly<Record<string, string>> = {
  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      strict: true,
      target: 'esnext',
      module: 'esnext',
      moduleResolution: 'bundler',
      paths: { '@xaendar/core': ['./stubs/core.ts'], '@xaendar/core/signals': ['./stubs/signals.ts'], '@app/*': ['./src/*'] }
    },
    include: ['src', 'stubs']
  }),
  'node_modules/@acme/format/package.json': JSON.stringify({
    name: '@acme/format',
    exports: { '.': { types: './index.d.ts', default: './index.js' } }
  }),
  'node_modules/@acme/format/index.d.ts': [
    '/** Formats a price. */',
    'export declare function formatPrice(value: number): string;',
    'export declare const CURRENCY: string;',
    ''
  ].join('\n'),
  'node_modules/@acme/format/index.js': 'export const formatPrice = value => `${value}`;\nexport const CURRENCY = \'EUR\';\n',
  'stubs/signals.ts': 'export type Signal<T> = () => T;\nexport type Computed<T> = () => T;\n',
  'stubs/core.ts': [
    'export type InputSignal<T> = () => T;',
    'export type Output<T = void> = { emit(value: T): void };',
    'type Decorator = (...args: any[]) => any;',
    'export declare function WebComponent(options: { selector: string, templateUrl: string }): Decorator;',
    'export declare function Directive(options: { selector: string }): Decorator;',
    'export declare const Property: ((...args: any[]) => Decorator) & { required: (...args: any[]) => Decorator };',
    'export declare function Event(): Decorator;',
    'export declare class CustomElement extends HTMLElement { onInit?(): void; effect(callback: () => void): () => void; }',
    ''
  ].join('\n'),
  'src/child-base.ts': [
    'import { Event, Output } from \'@xaendar/core\';',
    'export class ChildBase {',
    '  /** Emitted when the child is closed. */',
    '  @Event() accessor closed!: Output<boolean>;',
    '}',
    ''
  ].join('\n'),
  'src/child.ts': [
    'import { Event, InputSignal, Output, Property, WebComponent } from \'@xaendar/core\';',
    'import { ChildBase } from \'./child-base\';',
    '/** A child component. */',
    '@WebComponent({ selector: \'my-child\', templateUrl: \'./child.html\' })',
    'export class Child extends ChildBase {',
    '  /**',
    '   * The text of the child.',
    '   *',
    '   * @example <my-child label="a" />',
    '   */',
    '  @Property.required() accessor label!: InputSignal<string>;',
    '  @Property(0, { alias: \'size\' }) accessor amount!: InputSignal<number>;',
    '  @Event() accessor picked!: Output<number>;',
    '}',
    ''
  ].join('\n'),
  'src/directives.ts': [
    'import { Directive, Event, InputSignal, Output, Property } from \'@xaendar/core\';',
    '/** Shows a tooltip. */',
    '@Directive({ selector: \'tooltip\' })',
    'export class Tooltip {',
    '  @Property(\'\') accessor text!: InputSignal<string>;',
    '  @Event() accessor shown!: Output<string>;',
    '}',
    '@Directive({ selector: \'media\' })',
    'export class Media {',
    '  @Property(\'\') accessor query!: InputSignal<string>;',
    '}',
    ''
  ].join('\n'),
  'src/app.ts': [
    'import { CustomElement, WebComponent } from \'@xaendar/core\';',
    '@WebComponent({ selector: \'my-app\', templateUrl: \'./app.html\' })',
    'export class App extends CustomElement {',
    '  items = [{ id: 1, name: \'a\' }];',
    '  /** The title of the page. */',
    '  title = \'x\';',
    '  select(value: number): number { return value; }',
    '}',
    ''
  ].join('\n'),
  'src/app.html': '',
  'src/utils.ts': [
    '/** Formats a date. */',
    'export function formatDate(value: number): string { return `${value}`; }',
    'export enum Status { Active, Archived }',
    'export interface Row { id: number }',
    'export const LIMIT = 10;',
    'export class Shape {}',
    'export function title(): string { return \'\'; }',
    'export default function shout(value: string): string { return value; }',
    ''
  ].join('\n')
};

/**
 * Writes the fixture project in a new temporary directory.
 *
 * @returns The project.
 */
export function createFixtureProject(): FixtureProject {
  // The real path, which TypeScript resolves the files of the packages to: the temporary directory can be reached through a short name or a symlink
  const root = toPosixPath(realpathSync.native(mkdtempSync(join(tmpdir(), 'xaendar-language-core-'))));
  const path = (relativePath: string) => `${root}/${relativePath}`;
  const write = (relativePath: string, text: string) => {
    mkdirSync(dirname(path(relativePath)), { recursive: true });
    writeFileSync(path(relativePath), text);
  };

  const fixtureFiles = Object.entries(FIXTURE_FILES);
  for (let i = 0; i < fixtureFiles.length; i++) {
    const [relativePath, text] = fixtureFiles[i];
    write(relativePath, text);
  }

  return {
    root,
    path,
    write,
    analyze: source => analyzeTemplate(path('src/app.html'), source, new Map([[path('src/app.ts'), ['App']]])),
    dispose: () => rmSync(root, { recursive: true, force: true })
  };
}
