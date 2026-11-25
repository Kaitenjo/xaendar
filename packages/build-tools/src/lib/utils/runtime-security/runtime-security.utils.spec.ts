import { describe, expect, it } from 'vitest';
import { toRuntimeSecurity } from './runtime-security.utils';

describe('toRuntimeSecurity()', () => {
  it('writes the defaults of xaendar.json for the options left out', () => {
    expect(JSON.parse(toRuntimeSecurity({}))).toEqual({ urls: 'remove', resourceUrls: 'remove', trustedOrigins: [], rejectUnsafeBindings: true });
  });

  it('writes the options of the project, the trusted origins each once and as origins', () => {
    const security = toRuntimeSecurity({ urls: 'remove', resourceUrls: 'off', rejectUnsafeBindings: false, trustedOrigins: ['https://CDN.example.com/', 'https://cdn.example.com', 'http://localhost:8080'] });

    expect(JSON.parse(security)).toEqual({ urls: 'remove', resourceUrls: 'off', trustedOrigins: ['https://cdn.example.com', 'http://localhost:8080'], rejectUnsafeBindings: false });
  });

  it('writes the options of the sanitizer of the project, only when it sets them', () => {
    const html = { allowElements: ['iframe'], allowAttributes: ['src'] };

    expect(JSON.parse(toRuntimeSecurity({ html }))).toEqual({ urls: 'remove', resourceUrls: 'remove', trustedOrigins: [], rejectUnsafeBindings: true, html });
  });

  it('rejects options of the sanitizer that are not lists of names, or keep what always runs code', () => {
    expect(() => toRuntimeSecurity({ html: { allowElements: 'iframe' } as never })).toThrow('"html" of the security of xaendar.json holds allowElements, which is not a list of names');
    expect(() => toRuntimeSecurity({ html: { allowElements: ['script'] } })).toThrow('"html" of the security of xaendar.json keeps what always runs code (The allowElements of the sanitizer list script, keeping <script>');
  });

  it.each([['cdn.example.com'], ['https://cdn.example.com/path'], ['https://cdn.example.com?q'], ['data:text/plain,a']])('rejects %j, which is not an origin', listed => {
    expect(() => toRuntimeSecurity({ trustedOrigins: [listed] })).toThrow(`"trustedOrigins" of the security of xaendar.json lists ${listed}, which is not an origin: write its scheme, its host and its port, if any, as https://cdn.example.com`);
  });
});
