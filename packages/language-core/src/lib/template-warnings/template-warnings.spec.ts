import { parseTemplate } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { getTemplateWarnings } from './template-warnings';

/**
 * The warnings of a template, as the text of the template they are reported on and their message.
 */
const warn = (source: string, shadowingMembers: readonly string[] = []) => getTemplateWarnings(parseTemplate(source), shadowingMembers).map(({ span, message }) => [source.slice(span.start, span.end), message]);

/**
 * The names of the globals reported in a template.
 */
const reads = (source: string, shadowingMembers?: readonly string[]) => warn(source, shadowingMembers).map(([text]) => text);

describe('getTemplateWarnings', () => {
  describe('in a project rendering on the server', () => {
    it('says nothing about the blocks', () => {
      expect(warn('@hydrate (idle) { a } @client { b }')).toEqual([]);
    });

    it('reports the reads of the globals only the browser has, on their name, suggesting @client', () => {
      expect(warn('<p>{ document.title }</p>')).toEqual([
        ['document', '\'document\' exists only in the browser: on the server it is undefined. Read it in a @client block, or check it with typeof.']
      ]);
    });

    it.each([
      ['an attribute', '<p title="{ window.name }"></p>', 'window'],
      ['a class binding', '<p [class.a]="{ innerWidth > 1 }"></p>', 'innerWidth'],
      ['a @if', '@if (matchMedia(\'print\').matches) { }', 'matchMedia'],
      ['a @for', '@for (item of history.state; track item()) { }', 'history'],
      ['a @switch', '@switch (location.hash) { }', 'location'],
      ['a @let', '@let a = screen.width;', 'screen'],
      ['a @render', '<template row(a: unknown)></template>@render row(Notification)', 'Notification'],
      ['a structural directive', '<p *later(allow="{ document.hidden }")></p>', 'document'],
      ['a placeholder', '@client { } @placeholder { { document.title } }', 'document'],
      ['a @hydrate', '@hydrate (idle) { { document.title } }', 'document'],
      ['a shorthand property', '{ { window } }', 'window'],
      ['the storages Node declares too', '{ localStorage.length }', 'localStorage'],
      ['the agent Node declares too', '{ navigator.onLine }', 'navigator']
    ])('reads the expressions of %s', (_case, source, name) => {
      expect(reads(source)).toEqual([name]);
    });

    it('reports every read of an expression', () => {
      expect(reads('{ document.title + window.name }')).toEqual(['document', 'window']);
    });

    it.each([
      ['the content of a @client', '@client { { document.title } }'],
      ['the listeners', '<p (click)="send(document.title)"></p>'],
      ['the custom directives', '<p @@tip(text="{ document.title }")></p>'],
      ['the when of a @hydrate', '@hydrate (when document.hidden) { }'],
      ['the globals Node has', '{ console.log(URL.canParse(a)) + fetch(b) }'],
      ['the globals of ECMAScript', '{ Math.max(JSON.stringify(a)) }'],
      ['the names of the members read', '{ user.document + user.window?.location }'],
      ['the keys of an object', '{ { document: 1 } }'],
      ['a read through globalThis', '{ globalThis.document?.title }'],
      ['a read guarded by typeof', '{ typeof document !== \'undefined\' && document.title }'],
      ['a read guarded after it', '{ document?.title ?? typeof document }'],
      ['an imported name', '@import { location } from \'./a\';\n{ location }'],
      ['an element ref', '<p #top></p>{ top.id }'],
      ['a @let', '@let screen = 1;\n{ screen }'],
      ['a variable of a @for', '@for (status of items; track status()) { { status } }'],
      ['a parameter of a template', '<template row(name: string)>{ name }</template>'],
      ['the types of the casts', '{ format(value as HTMLElement) }']
    ])('leaves out %s', (_case, source) => {
      expect(reads(source)).toEqual([]);
    });

    it('leaves out the members of the component named like a global', () => {
      expect(reads('{ status + location }', ['status', 'location'])).toEqual([]);
    });
  });
});
