import { describe, expect, it } from 'vitest';
import { TrustedUrl } from '../../models/trusted-url/trusted-url';
import { trustResourceUrl, trustUrl } from './trust-url.util';

describe('trustUrl()', () => {
  it('marks a URL as trusted, written as it is', () => {
    const trusted = trustUrl('javascript:void(0)');

    expect(trusted).toBeInstanceOf(TrustedUrl);
    expect(trusted).toMatchObject({ url: 'javascript:void(0)', resource: false });
    expect(String(trusted)).toBe('javascript:void(0)');
  });
});

describe('trustResourceUrl()', () => {
  it('marks a URL as trusted to load a resource too', () => {
    const trusted = trustResourceUrl('https://maps.example.com/embed');

    expect(trusted).toBeInstanceOf(TrustedUrl);
    expect(trusted).toMatchObject({ url: 'https://maps.example.com/embed', resource: true });
    expect(`${trusted}`).toBe('https://maps.example.com/embed');
  });
});
