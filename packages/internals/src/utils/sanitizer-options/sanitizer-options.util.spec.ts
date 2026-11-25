import { describe, expect, it } from 'vitest';
import { describeUnsafeSanitizerOptions } from './sanitizer-options.util';

describe('describeUnsafeSanitizerOptions', () => {
  it.each([
    [{ allowElements: ['SCRIPT'] }, 'The allowElements of the sanitizer list SCRIPT, keeping <script>, whose code the browser runs once the page rendered on the server holds it'],
    [{ allowElements: ['b*'] }, 'The allowElements of the sanitizer list b*, keeping <base>, which changes where every relative URL of the page leads'],
    [{ allowElements: ['meta'] }, 'The allowElements of the sanitizer list meta, keeping <meta>, which can send the page elsewhere (http-equiv="refresh")'],
    [{ allowAttributes: ['onclick'] }, 'The allowAttributes of the sanitizer list onclick, keeping an attribute the browser runs (on*, srcdoc)'],
    [{ allowAttributes: ['img[onError]'] }, 'The allowAttributes of the sanitizer list img[onError], keeping an attribute the browser runs (on*, srcdoc)'],
    [{ allowAttributes: ['o*'] }, 'The allowAttributes of the sanitizer list o*, keeping an attribute the browser runs (on*, srcdoc)'],
    [{ allowAttributes: ['iframe[srcdoc]'] }, 'The allowAttributes of the sanitizer list iframe[srcdoc], keeping an attribute the browser runs (on*, srcdoc)'],
    [{ urlSchemes: ['https', 'JavaScript'] }, 'The urlSchemes of the sanitizer list JavaScript, a scheme running code']
  ])('describes the options keeping what always runs code: %j', (options, description) => {
    expect(describeUnsafeSanitizerOptions(options)).toBe(description);
  });

  it('describes nothing for the options naming what only looks like what runs code, or no option', () => {
    expect(describeUnsafeSanitizerOptions({ allowElements: ['scripts', 'p*'], allowAttributes: ['data-*', 'no-onclick', 'srcset'], urlSchemes: ['data'] })).toBeUndefined();
    expect(describeUnsafeSanitizerOptions({})).toBeUndefined();
  });
});
