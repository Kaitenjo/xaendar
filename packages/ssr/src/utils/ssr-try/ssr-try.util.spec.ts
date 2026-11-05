import { describe, expect, it, vi } from 'vitest';
import type { ServerOutput } from '../../types/server-output.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _ssrTry } = await import('./ssr-try.util');

describe('_ssrTry', () => {
  it('writes the content between the markers of a content rendered', () => {
    const out: ServerOutput = ['<p>'];
    const pending = Promise.resolve<ServerOutput>(['later']);

    _ssrTry(out, output => output.push('<b>', pending, '</b>'), output => output.push('<i></i>'));

    expect(out).toEqual(['<p>', '<!--xd-t:0-->', '<b>', pending, '</b>', '<!--/xd-t-->']);
  });

  it('drops what the content wrote before throwing, and writes the @catch with the error between the markers of a @catch rendered', () => {
    const out: ServerOutput = [];
    const failure = new Error('broken');
    const errors = new Array<unknown>();

    _ssrTry(out, output => {
      output.push('<b>');
      throw failure;
    }, (output, error) => {
      errors.push(error);
      output.push('<i></i>');
    });

    expect(out).toEqual(['<!--xd-t:1-->', '<i></i>', '<!--/xd-t-->']);
    expect(errors).toEqual([failure]);
  });

  it('lets the error of the @catch through, writing nothing', () => {
    const out: ServerOutput = [];
    const fallbackFailure = new Error('catch');

    expect(() => _ssrTry(out, () => {
      throw new Error('content');
    }, () => {
      throw fallbackFailure;
    })).toThrow(fallbackFailure);
    expect(out).toEqual([]);
  });
});
