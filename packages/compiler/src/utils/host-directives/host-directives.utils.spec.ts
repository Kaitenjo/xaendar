import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSourceFile, ScriptTarget, SourceFile } from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { extractComponentsMetadataFromSourceFile } from '../metadata/metadata.utils';

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
    expect(metadata?.properties.get('text')).toMatchObject({ name: 'text', type: propertyType('Tooltip', 'text'), required: true, alias: undefined });
    expect(metadata?.properties.get('pos')).toMatchObject({ name: 'position', type: propertyType('Tooltip', 'position'), alias: 'pos' });
    expect([...metadata!.events.keys()]).toEqual(['opened']);
    expect(metadata?.events.get('opened')?.type).toBe(eventType('Tooltip', 'opened'));
  });

  it('adds them under the name they are exposed with', async () => {
    const metadata = (await extract(host('[{ directive: Tooltip, properties: [{ name: \'text\', alias: \'label\' }, { name: \'pos\', alias: \'place\' }], events: [{ name: \'opened\', alias: \'shown\' }] }]')))?.get('MyEl');

    expect([...metadata!.properties.keys()]).toEqual(['label', 'place']);
    expect(metadata?.properties.get('label')).toMatchObject({ name: 'text', alias: 'label', required: true });
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
  });
});
