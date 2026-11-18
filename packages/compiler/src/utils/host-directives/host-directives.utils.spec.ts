import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSourceFile, ScriptTarget, SourceFile } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { extractComponentsMetadataFromSourceFile, findHostDirectiveErrors } from '../metadata/metadata.utils';

const sourceFileOf = (code: string): SourceFile => createSourceFile('component.ts', code, ScriptTarget.Latest, true);
const extract = (code: string) => extractComponentsMetadataFromSourceFile(sourceFileOf(code));
const component = (body = '', decorator = '@WebComponent({ selector: \'my-el\', templateUrl: \'./t.xaendar\' })') => `${decorator}\nclass MyEl {\n${body}\n}`;
const propertyType = (className: string, member: string, module = 'component') => `ReturnType<import('${module}').${className}['${member}']>`;
const eventType = (className: string, member: string) => `(import('component').${className}['${member}'] extends import('@xaendar/core').Output<infer Value> ? Value : never)`;

describe('addHostDirectiveBindings', () => {
  const tooltip = `
    @Directive({ selector: 'tooltip' })
    class Tooltip {
      @Property.required() accessor text!: InputSignal<string>;
      @Property('top', { alias: 'pos' }) accessor position!: InputSignal<string>;
      @Event() accessor opened!: Output<number>;
      @Event() accessor closed!: Output<void>;
    }
  `;
  const host = (hostDirectives: string, body = '') => `${tooltip}\n${component(body, `@WebComponent({ selector: 'my-el', hostDirectives: ${hostDirectives}, templateUrl: './t.xaendar' })`)}`;

  it('adds the inputs and the events the component exposes, as if it declared them', async () => {
    const metadata = (await extract(host('[{ directive: Tooltip, properties: [\'text\', \'pos\'], events: [\'opened\'] }]')))?.get('MyEl');

    expect([...metadata!.properties.keys()]).toEqual(['text', 'pos']);
    expect(metadata?.properties.get('text')).toMatchObject({ name: 'text', type: propertyType('Tooltip', 'text'), required: true, alias: undefined, exposed: true });
    expect(metadata?.properties.get('pos')).toMatchObject({ name: 'position', type: propertyType('Tooltip', 'position'), alias: 'pos' });
    expect([...metadata!.events.keys()]).toEqual(['opened']);
    expect(metadata?.events.get('opened')?.type).toBe(eventType('Tooltip', 'opened'));
  });

  it('adds them under the name they are exposed with', async () => {
    const metadata = (await extract(host('[{ directive: Tooltip, properties: [{ name: \'text\', alias: \'label\' }, { name: \'pos\', alias: \'place\' }], events: [{ name: \'opened\', alias: \'shown\' }] }]')))?.get('MyEl');

    expect([...metadata!.properties.keys()]).toEqual(['label', 'place']);
    expect(metadata?.properties.get('label')).toMatchObject({ name: 'text', alias: 'label', required: true, exposed: true });
    expect(metadata?.properties.get('place')).toMatchObject({ name: 'position', alias: 'place' });
    expect([...metadata!.events.keys()]).toEqual(['shown']);
  });

  it('ignores an object without a literal name and alias, and the colon syntax', async () => {
    const metadata = (await extract(host('[{ directive: Tooltip, properties: [{ name: "text" }, { alias: "label" }, { name: text, alias: "label" }, { name: "text", alias: label }, "text: label"], events: ["opened: shown"] }]')))?.get('MyEl');

    expect(metadata?.properties.size).toBe(0);
    expect(metadata?.events.size).toBe(0);
  });

  it('adds nothing for a directive declared by its class, or exposing nothing', async () => {
    for (const hostDirectives of ['[Tooltip]', '[{ directive: Tooltip }]', '[{ directive: Tooltip, properties: [], events: [] }]']) {
      const metadata = (await extract(host(hostDirectives)))?.get('MyEl');

      expect(metadata?.properties.size).toBe(0);
      expect(metadata?.events.size).toBe(0);
    }
  });

  it('supports a directive written as a shorthand property, and several host directives', async () => {
    const code = `${tooltip}\nclass Other { @Event() accessor done!: Output<boolean>; }\nclass directive extends Tooltip { }\n${component('', '@WebComponent({ selector: \'my-el\', hostDirectives: [{ directive, properties: [\'text\'] }, { directive: Other, events: [\'done\'] }], templateUrl: \'./t.xaendar\' })')}`;
    const metadata = (await extract(code))?.get('MyEl');

    expect([...metadata!.properties.keys()]).toEqual(['text']);
    expect([...metadata!.events.keys()]).toEqual(['done']);
  });

  it('skips what it cannot resolve: a missing directive, input or event, a name the component already uses', async () => {
    const metadata = (await extract(host('[{ directive: Missing, properties: [\'text\'] }, { directive: Tooltip, properties: [\'missing\', \'text\'], events: [\'missing\', \'opened\'] }]', '@Property() accessor text!: InputSignal<number>;\n@Event() accessor opened!: Output<string>;')))?.get('MyEl');

    expect(metadata?.properties.get('text')?.type).toBe(propertyType('MyEl', 'text'));
    expect(metadata?.events.get('opened')?.type).toBe(eventType('MyEl', 'opened'));
    expect(metadata?.properties.size).toBe(1);
    expect(metadata?.events.size).toBe(1);
  });

  it('ignores a declaration it cannot read', async () => {
    for (const hostDirectives of ['hosts', '[{ properties: [\'text\'] }, { directive: Tooltip, properties: text, events: [name, 3, \'opened\'] }]']) {
      const metadata = (await extract(host(hostDirectives)))?.get('MyEl');

      expect(metadata?.properties.size).toBe(0);
    }

    const noArguments = (await extract(`${tooltip}\n@WebComponent({ selector: 'my-el', templateUrl: './t.xaendar', hostDirectives: [{ directive: Tooltip, events: ['opened'] }] })\nclass MyEl {}`))?.get('MyEl');
    expect(noArguments?.events.has('opened')).toBe(true);
  });

  describe('directives declared in other files', () => {
    let root: string;

    beforeAll(() => {
      root = mkdtempSync(join(tmpdir(), 'xaendar-host-directives-')).replaceAll('\\', '/');
      writeFileSync(`${root}/anonymous.ts`, 'export default class { @Property() accessor text!: InputSignal<string>; }');
      writeFileSync(`${root}/tooltip.ts`, 'export class Tooltip { @Property() accessor text!: InputSignal<string>; @Event() accessor opened!: Output<number>; }');
      const library = `${root}/node_modules/@acme/ui`;
      mkdirSync(`${library}/tooltip`, { recursive: true });
      writeFileSync(`${library}/package.json`, JSON.stringify({ name: '@acme/ui', exports: { '.': { types: './public-api.d.ts' }, './tooltip/tooltip.directive': { types: './tooltip/tooltip.directive.d.ts' } }, xaendar: { manifest: './xaendar-manifest.json' } }));
      writeFileSync(`${library}/public-api.d.ts`, "export { TooltipDirective as Tooltip } from './tooltip/tooltip.directive.js';");
      writeFileSync(`${library}/tooltip/tooltip.directive.d.ts`, 'export declare class TooltipDirective {}');
      writeFileSync(`${library}/xaendar-manifest.json`, JSON.stringify({
        schemaVersion: 1, name: '@acme/ui', version: '1.0.0', xaendar: '1.0.0', ssr: false, selectors: ['@@uiTooltip'],
        exports: { '.': { Tooltip: 'tooltip/tooltip.directive#TooltipDirective' } },
        declarations: {
          'tooltip/tooltip.directive#TooltipDirective': {
            type: 'directive', className: 'TooltipDirective', selector: 'uiTooltip', module: './tooltip/tooltip.directive', types: './tooltip/tooltip.directive.d.ts',
            inputs: [{ name: 'text', type: 'string' }], events: [{ name: 'opened', type: 'number' }]
          }
        }
      }));
    });

    afterAll(() => {
      rmSync(root, { recursive: true, force: true });
    });

    it('skips a directive whose class has no name', async () => {
      const code = `import Anonymous from './anonymous';\n${component('', '@WebComponent({ selector: \'my-el\', hostDirectives: [{ directive: Anonymous, properties: [\'text\'] }], templateUrl: \'./t.xaendar\' })')}`;
      const metadata = (await extractComponentsMetadataFromSourceFile(createSourceFile(`${root}/my-el.ts`, code, ScriptTarget.Latest, true)))?.get('MyEl');

      expect(metadata?.properties.size).toBe(0);
    });

    it('references what they expose through the class of the directive', async () => {
      const code = `import { Tooltip } from './tooltip';\n${component('', '@WebComponent({ selector: \'my-el\', hostDirectives: [{ directive: Tooltip, properties: [\'text\'], events: [\'opened\'] }], templateUrl: \'./t.xaendar\' })')}`;
      const metadata = (await extractComponentsMetadataFromSourceFile(createSourceFile(`${root}/my-el.ts`, code, ScriptTarget.Latest, true)))?.get('MyEl');

      expect(metadata?.properties.get('text')?.type).toBe(`ReturnType<import('${root}/tooltip').Tooltip['text']>`);
      expect(metadata?.events.get('opened')?.type).toBe(`(import('${root}/tooltip').Tooltip['opened'] extends import('@xaendar/core').Output<infer Value> ? Value : never)`);
    });

    it('reads a directive of a compiled library from the manifest of its package', async () => {
      const decorator = "@WebComponent({ selector: 'my-el', hostDirectives: [{ directive: Tooltip, properties: [{ name: 'text', alias: 'hint' }], events: ['opened'] }], templateUrl: './t.xaendar' })";
      const code = `import { Tooltip } from '@acme/ui';
${component('', decorator)}`;
      const metadata = (await extractComponentsMetadataFromSourceFile(createSourceFile(`${root}/my-el.ts`, code, ScriptTarget.Latest, true)))?.get('MyEl');

      expect(metadata?.properties.get('hint')).toMatchObject({ name: 'text', type: 'string', alias: 'hint', exposed: true });
      expect(metadata?.events.get('opened')).toEqual({ type: 'number' });
    });
  });

  describe('inheritance', () => {
    it('adds the inputs and the events the host directives of the ancestors expose, the ones of the ancestors first', async () => {
      const code = `${tooltip}
class Other { @Property() accessor tone!: InputSignal<string>; @Event() accessor done!: Output<boolean>; }
@WebComponent({ selector: 'base-el', hostDirectives: [{ directive: Tooltip, properties: ['text'], events: ['opened'] }], templateUrl: './b.xaendar' })
class Base { }
class Middle extends Base { }
@WebComponent({ selector: 'my-el', hostDirectives: [{ directive: Other, properties: ['tone'], events: ['done'] }], templateUrl: './t.xaendar' })
class MyEl extends Middle { }`;
      const metadata = (await extract(code))?.get('MyEl');

      expect([...metadata!.properties.keys()]).toEqual(['text', 'tone']);
      expect(metadata?.properties.get('text')).toMatchObject({ name: 'text', exposed: true });
      expect([...metadata!.events.keys()]).toEqual(['opened', 'done']);
    });
  });
});

describe('findHostDirectiveErrors', () => {
  const directives = `
    @Directive({ selector: 'tooltip' })
    class Tooltip {
      @Property() accessor text!: InputSignal<string>;
      @Property('top', { alias: 'pos' }) accessor position!: InputSignal<string>;
      @Event() accessor opened!: Output<number>;
    }

    @Directive({ selector: 'label' })
    class Label {
      @Property() accessor text!: InputSignal<string>;
      @Event() accessor opened!: Output<number>;
    }
  `;
  const decorator = (hostDirectives: string, selector = 'my-el') => `@WebComponent({ selector: '${selector}', hostDirectives: ${hostDirectives}, templateUrl: './t.xaendar' })`;

  /**
   * Finds the errors of a file holding the directives and the given code, each with the text it is reported on.
   */
  function errorsOf(code: string): Array<[string, string]> {
    const sourceFile = sourceFileOf(`${directives}\n${code}`);
    return findHostDirectiveErrors(sourceFile).map(({ message, span }) => [message, sourceFile.text.slice(span.start, span.end)]);
  }

  it('finds nothing for a component without host directives, or whose host directives can be applied', () => {
    expect(errorsOf(component())).toEqual([]);
    expect(errorsOf(component('', decorator('[{ directive: Tooltip, properties: [\'text\', { name: \'pos\', alias: \'place\' }], events: [\'opened\'] }, Label]')))).toEqual([]);
    expect(errorsOf(component('', decorator('[{ directive: Missing, properties: [\'text\'] }]')))).toEqual([]);
  });

  it('reports a directive declared twice, and an input or an event it does not declare, on the declaration', () => {
    expect(errorsOf(component('', decorator('[Tooltip, { directive: Tooltip }]')))).toEqual([['MyEl declares the host directive Tooltip more than once', 'Tooltip']]);
    expect(errorsOf(component('', decorator('[{ directive: Tooltip, properties: [\'missing\', \'position\'], events: [{ name: \'closed\', alias: \'shut\' }] }]')))).toEqual([
      ['Tooltip does not declare an input named "missing"', '\'missing\''],
      ['Tooltip does not declare an input named "position"', '\'position\''],
      ['Tooltip does not declare an event named "closed"', '{ name: \'closed\', alias: \'shut\' }']
    ]);
  });

  it('reports a name already used by an input, a member or an event of the component, or by another exposure', () => {
    const body = '@Property() accessor value!: InputSignal<string>;\n@Property(\'\', { alias: \'kind\' }) accessor type!: InputSignal<string>;\n@Event() accessor done!: Output<void>;\nlabel = 1;\nreset(): void { }';
    const hostDirectives = '[{ directive: Tooltip, properties: [{ name: \'text\', alias: \'value\' }, { name: \'text\', alias: \'kind\' }, { name: \'text\', alias: \'type\' }, { name: \'text\', alias: \'label\' }, { name: \'text\', alias: \'reset\' }, \'text\'], events: [{ name: \'opened\', alias: \'done\' }, \'opened\'] }, { directive: Label, properties: [\'text\'], events: [\'opened\'] }]';

    expect(errorsOf(component(body, decorator(hostDirectives))).map(([message]) => message)).toEqual([
      'MyEl already has an input named "value", which Tooltip cannot expose',
      'MyEl already has an input named "kind", which Tooltip cannot expose',
      'MyEl already has a member named "type", which Tooltip cannot expose as an input',
      'MyEl already has a member named "label", which Tooltip cannot expose as an input',
      'MyEl already has a member named "reset", which Tooltip cannot expose as an input',
      'MyEl already has an event named "done", which Tooltip cannot expose',
      'MyEl already has an input named "text", which Label cannot expose',
      'MyEl already has an event named "opened", which Label cannot expose'
    ]);
  });

  it('reads nothing from an ancestor whose options are not an object literal', () => {
    expect(errorsOf(`@WebComponent(options)
class Base { }
${decorator('[Tooltip, { directive: Tooltip }]')}
class MyEl extends Base { }`)).toEqual([['MyEl declares the host directive Tooltip more than once', 'Tooltip']]);
  });

  it('ignores the static members of the component', () => {
    expect(errorsOf(component('static label = 1;', decorator('[{ directive: Tooltip, properties: [{ name: \'text\', alias: \'label\' }] }]')))).toEqual([]);
  });

  it('checks the host directives of the ancestors with the ones of the component, reporting theirs on the name of the class', () => {
    const base = `${decorator('[{ directive: Tooltip, properties: [\'text\'], events: [\'opened\'] }]', 'base-el')}\nclass Base { }`;

    expect(errorsOf(`${base}\n${decorator('[Tooltip]')}\nclass MyEl extends Base { }`)).toEqual([['MyEl declares the host directive Tooltip more than once', 'Tooltip']]);
    expect(errorsOf(`${base}\n${decorator('[{ directive: Label, properties: [\'text\'], events: [\'opened\'] }]')}\nclass MyEl extends Base { }`).map(([message, text]) => [message, text])).toEqual([
      ['MyEl already has an input named "text", which Label cannot expose', '\'text\''],
      ['MyEl already has an event named "opened", which Label cannot expose', '\'opened\'']
    ]);
    expect(errorsOf(`${base}\n${decorator('[Label]')}\nclass MyEl extends Base {\n  text(): void { }\n}`)).toEqual([['MyEl already has a member named "text", which Tooltip cannot expose as an input', 'MyEl']]);
    expect(errorsOf(`${decorator('[Tooltip]', 'base-el')}\nclass Base { }\n${decorator('[Label]')}\nclass MyEl extends Base { }`)).toEqual([]);
  });

  it('reports a directive of an ancestor the component declares again on the name of the class', () => {
    const code = `${decorator('[Tooltip]', 'base-el')}\nclass Base { }\n${decorator('[Label]', 'middle-el')}\nclass Middle extends Base { }\n@WebComponent({ selector: 'my-el', templateUrl: './t.xaendar' })\nclass MyEl extends Middle { }`;

    expect(errorsOf(code)).toEqual([]);
    expect(errorsOf(`${decorator('[Tooltip]', 'base-el')}\nclass Base { }\n${decorator('[Tooltip]', 'middle-el')}\nclass Middle extends Base { }\n@WebComponent({ selector: 'my-el', templateUrl: './t.xaendar' })\nclass MyEl extends Middle { }`)).toEqual([
      ['Middle declares the host directive Tooltip more than once', 'Tooltip'],
      ['MyEl declares the host directive Tooltip more than once', 'MyEl']
    ]);
  });
});
