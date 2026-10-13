import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { analyzeTemplate, type TemplateAnalysisResult } from '../../template-analysis/template-analysis';
import { toPosixPath } from '../../utils/path/path.utils';

/**
 * A TypeScript project written in a temporary directory, for the specs analyzing real templates: a component `App`
 * using the template `src/app.html`, a component `Child` (`my-child`, inheriting the event `closed` from `ChildBase`)
 * and the directives `Tooltip` (`tooltip`) and `Media` (`media`).
 */
export type FixtureProject = {
  /**
   * The root directory of the project, in posix format.
   */
  readonly root: string;
  /**
   * Returns the absolute path, in posix format, of a file of the project.
   */
  readonly path: (relativePath: string) => string;
  /**
   * Writes a file of the project.
   */
  readonly write: (relativePath: string, text: string) => void;
  /**
   * Analyzes a source as the template of `App`.
   */
  readonly analyze: (source: string) => Promise<TemplateAnalysisResult>;
  /**
   * Deletes the project.
   */
  readonly dispose: () => void;
};

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
      paths: { '@xaendar/core': ['./stubs/core.ts'], '@xaendar/core/signals': ['./stubs/signals.ts'] }
    },
    include: ['src', 'stubs']
  }),
  'stubs/signals.ts': 'export type Signal<T> = () => T;\n',
  'stubs/core.ts': [
    'export type InputSignal<T> = () => T;',
    'export type Output<T = void> = { emit(value: T): void };',
    'type Decorator = (...args: any[]) => any;',
    'export declare function WebComponent(options: { selector: string, templateUrl: string }): Decorator;',
    'export declare function Directive(options: { selector: string }): Decorator;',
    'export declare const Property: ((...args: any[]) => Decorator) & { required: (...args: any[]) => Decorator };',
    'export declare function Event(): Decorator;',
    ''
  ].join('\n'),
  'src/child-base.ts': [
    'import { Event, Output } from \'@xaendar/core\';',
    'export class ChildBase {',
    '  @Event() accessor closed!: Output<boolean>;',
    '}',
    ''
  ].join('\n'),
  'src/child.ts': [
    'import { Event, InputSignal, Output, Property, WebComponent } from \'@xaendar/core\';',
    'import { ChildBase } from \'./child-base\';',
    '@WebComponent({ selector: \'my-child\', templateUrl: \'./child.html\' })',
    'export class Child extends ChildBase {',
    '  @Property.required() accessor label!: InputSignal<string>;',
    '  @Property(0, { alias: \'size\' }) accessor amount!: InputSignal<number>;',
    '  @Event() accessor picked!: Output<number>;',
    '}',
    ''
  ].join('\n'),
  'src/directives.ts': [
    'import { Directive, Event, InputSignal, Output, Property } from \'@xaendar/core\';',
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
    'import { WebComponent } from \'@xaendar/core\';',
    '@WebComponent({ selector: \'my-app\', templateUrl: \'./app.html\' })',
    'export class App {',
    '  items = [{ id: 1, name: \'a\' }];',
    '  title = \'x\';',
    '  select(value: number): number { return value; }',
    '}',
    ''
  ].join('\n'),
  'src/app.html': ''
};

/**
 * Writes the fixture project in a new temporary directory.
 *
 * @returns The project.
 */
export function createFixtureProject(): FixtureProject {
  const root = toPosixPath(mkdtempSync(join(tmpdir(), 'xaendar-language-core-')));
  const path = (relativePath: string) => `${root}/${relativePath}`;
  const write = (relativePath: string, text: string) => {
    mkdirSync(dirname(path(relativePath)), { recursive: true });
    writeFileSync(path(relativePath), text);
  };

  Object.entries(FIXTURE_FILES).forEach(([relativePath, text]) => write(relativePath, text));

  return {
    root,
    path,
    write,
    analyze: source => analyzeTemplate(path('src/app.html'), source, new Map([[path('src/app.ts'), ['App']]])),
    dispose: () => rmSync(root, { recursive: true, force: true })
  };
}
