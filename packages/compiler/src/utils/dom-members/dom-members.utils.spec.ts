import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getHTMLElementMembers, getNativeClassMembers, getNativeClassOfTag, readDomLibrary, readInterfaceMembers } from './dom-members.utils';

describe('getHTMLElementMembers', () => {
  it('reads the members of HTMLElement and of the interfaces it extends from the DOM library', () => {
    const members = getHTMLElementMembers();

    for (const name of ['id', 'title', 'hidden', 'tabIndex', 'innerHTML', 'onclick', 'appendChild', 'addEventListener', 'style', 'ariaLabel']) {
      expect(members.has(name)).toBe(true);
    }
    expect(members.has('label')).toBe(false);
  });

  it('reads the DOM library once', () => {
    expect(getHTMLElementMembers()).toBe(getHTMLElementMembers());
  });
});

describe('getNativeClassMembers', () => {
  it('reads the members of the class of a native element and of the interfaces it extends, HTMLElement included', () => {
    const members = getNativeClassMembers('HTMLButtonElement');

    for (const name of ['disabled', 'form', 'type', 'value', 'id', 'title', 'addEventListener']) {
      expect(members.has(name)).toBe(true);
    }
    expect(getNativeClassMembers('HTMLButtonElement')).toBe(members);
  });

  it('reads nothing for a class the DOM library does not declare', () => {
    expect(getNativeClassMembers('HTMLMissingElement').size).toBe(0);
  });
});

describe('getNativeClassOfTag', () => {
  it('reads the class of each native element from HTMLElementTagNameMap', () => {
    expect(getNativeClassOfTag('button')).toBe('HTMLButtonElement');
    expect(getNativeClassOfTag('h2')).toBe('HTMLHeadingElement');
    expect(getNativeClassOfTag('section')).toBe('HTMLElement');
    expect(getNativeClassOfTag('x-card')).toBeUndefined();
  });
});

describe('readInterfaceMembers', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'xaendar-dom-members-')).replaceAll('\\', '/');
    writeFileSync(`${root}/lib.d.ts`, `
      interface Base extends Mixin, Missing, Cycle, Ns.Other { base: string; 'quoted': number; [Symbol.iterator](): void; (): void; }
      interface Base { merged(): void; }
      interface Mixin { mixed: boolean; }
      interface Cycle extends Base { cycle: number; }
      interface HTMLElementTagNameMap { "a": HTMLAnchorElement; b: HTMLBElement; "c": Ns.CElement; "d": string; "e"; f(): void; }
      interface HTMLElementTagNameMap { "g": HTMLGElement; }
      declare var Base: { prototype: Base };
    `);
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('reads the members of every declaration of the interface and of the ones it extends, once each', () => {
    expect([...readInterfaceMembers(`${root}/lib.d.ts`, 'Base')].sort()).toEqual(['base', 'cycle', 'merged', 'mixed', 'quoted']);
  });

  it('reads nothing for an interface the file does not declare, or a file that cannot be read', () => {
    expect(readInterfaceMembers(`${root}/lib.d.ts`, 'Other').size).toBe(0);
    expect(readInterfaceMembers(`${root}/missing.d.ts`, 'Base').size).toBe(0);
  });

  it('reads the class of the tags every declaration of HTMLElementTagNameMap names by a string and a class', () => {
    writeFileSync(`${root}/plain.d.ts`, 'interface Plain { }');

    expect([...readDomLibrary(`${root}/lib.d.ts`).tagClasses]).toEqual([['a', 'HTMLAnchorElement'], ['g', 'HTMLGElement']]);
    expect(readDomLibrary(`${root}/plain.d.ts`).tagClasses.size).toBe(0);
    expect(readDomLibrary(`${root}/missing.d.ts`).tagClasses.size).toBe(0);
  });
});
