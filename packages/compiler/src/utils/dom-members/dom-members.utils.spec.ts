import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getHTMLElementMembers, readInterfaceMembers } from './dom-members.utils';

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

describe('readInterfaceMembers', () => {
  let root: string;

  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'xaendar-dom-members-')).replaceAll('\\', '/');
    writeFileSync(`${root}/lib.d.ts`, `
      interface Base extends Mixin, Missing, Cycle, Ns.Other { base: string; 'quoted': number; [Symbol.iterator](): void; (): void; }
      interface Base { merged(): void; }
      interface Mixin { mixed: boolean; }
      interface Cycle extends Base { cycle: number; }
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
});
