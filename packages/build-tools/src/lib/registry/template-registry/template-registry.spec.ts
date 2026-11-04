import { beforeEach, describe, expect, it } from 'vitest';
import { clearTemplateRegistry, findComponentPathsForTemplate, registerTemplatePath, removeComponentPath } from './template-registry';

beforeEach(() => {
  clearTemplateRegistry();
});

describe('template-registry', () => {
  it('maps a template to every component declaring it', () => {
    registerTemplatePath('/src/card.html', '/src/a.xd.component.ts');
    registerTemplatePath('/src/card.html', '/src/b.xd.component.ts');
    registerTemplatePath('/src/card.html', '/src/a.xd.component.ts');

    expect(findComponentPathsForTemplate('/src/card.html')).toEqual(new Set(['/src/a.xd.component.ts', '/src/b.xd.component.ts']));
    expect(findComponentPathsForTemplate('/src/other.html')).toBeUndefined();
  });

  it('removes a component, dropping the templates no other component declares', () => {
    registerTemplatePath('/src/card.html', '/src/a.xd.component.ts');
    registerTemplatePath('/src/a.html', '/src/a.xd.component.ts');
    registerTemplatePath('/src/card.html', '/src/b.xd.component.ts');

    removeComponentPath('/src/a.xd.component.ts');

    expect(findComponentPathsForTemplate('/src/card.html')).toEqual(new Set(['/src/b.xd.component.ts']));
    expect(findComponentPathsForTemplate('/src/a.html')).toBeUndefined();
  });

  it('ignores components without registered templates', () => {
    registerTemplatePath('/src/card.html', '/src/a.xd.component.ts');

    removeComponentPath('/src/unknown.xd.component.ts');

    expect(findComponentPathsForTemplate('/src/card.html')).toEqual(new Set(['/src/a.xd.component.ts']));
  });

  it('resets every mapping', () => {
    registerTemplatePath('/src/card.html', '/src/a.xd.component.ts');

    clearTemplateRegistry();

    expect(findComponentPathsForTemplate('/src/card.html')).toBeUndefined();
  });
});
