import { describe, expect, it } from 'vitest';
import { appendUrlCheck, getUrlCheck, toUrlCheckCall } from './url-check.utils';

describe('getUrlCheck()', () => {
  it('checks the URLs of the attributes holding them', () => {
    expect(getUrlCheck('a', 'href')).toBe('url');
    expect(getUrlCheck('img', 'srcSet')).toBe('url');
    expect(getUrlCheck('a', 'ping')).toBe('url');
  });

  it('checks the origin of the resources an attribute loads into the page', () => {
    expect(getUrlCheck('IFRAME', 'SRC')).toBe('resource');
    expect(getUrlCheck('link', 'href')).toBe('resource');
    expect(getUrlCheck('object', 'data')).toBe('resource');
  });

  it('checks nothing in the attributes holding no URL', () => {
    expect(getUrlCheck('a', 'title')).toBeUndefined();
  });
});

describe('appendUrlCheck()', () => {
  it('appends the checks the runtime makes', () => {
    const members = ['name: \'src\''];
    appendUrlCheck(members, 'resource');
    expect(members).toEqual(['name: \'src\'', 'url: true', 'resource: true']);
  });

  it('appends only the check of the URLs for an attribute loading no resource', () => {
    const members = new Array<string>();
    appendUrlCheck(members, 'url');
    expect(members).toEqual(['url: true']);
  });
});

describe('toUrlCheckCall()', () => {
  it('writes the call checking the URLs of a value', () => {
    expect(toUrlCheckCall('href', 'value', 'url')).toBe('_checkUrl(\'href\', value)');
    expect(toUrlCheckCall('src', 'value', 'resource')).toBe('_checkUrl(\'src\', value, true)');
  });
});
