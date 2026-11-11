import { describe, expect, it, vi } from 'vitest';
import type { ServerOutput } from '../../types/server-output.type';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  const { loadServerDom } = await import('@xaendar/ssr/dom');
  loadSignals();
  loadServerDom();
});

const { _Context } = await import('@xaendar/core');
const { _ssrTry } = await import('./ssr-try.util');

const context = new _Context({} as never);

describe('_ssrTry', () => {
  it('writes the content between the markers of a content rendered', () => {
    const out: ServerOutput = ['<p>'];
    const pending = Promise.resolve<ServerOutput>(['later']);

    _ssrTry(out, context, output => output.push('<b>', pending, '</b>'), output => output.push('<i></i>'));

    expect(out).toEqual(['<p>', '<!--xd-t:0-->', '<b>', pending, '</b>', '<!--/xd-t-->']);
  });

  it('drops what the content wrote before throwing, and writes the @catch with the error between the markers of a @catch rendered', () => {
    const out: ServerOutput = [];
    const failure = new Error('broken');
    const errors = new Array<unknown>();

    _ssrTry(out, context, output => {
      output.push('<b>');
      throw failure;
    }, (output, _context, error) => {
      errors.push(error);
      output.push('<i></i>');
    });

    expect(out).toEqual(['<!--xd-t:1-->', '<i></i>', '<!--/xd-t-->']);
    expect(errors).toEqual([failure]);
  });

  it('writes no marker closing the last block of its parent, after its content or its @catch', () => {
    const out: ServerOutput = [];
    const failed: ServerOutput = [];

    _ssrTry(out, context, output => output.push('<b></b>'), output => output.push('<i></i>'), true);
    _ssrTry(failed, context, () => {
      throw new Error('broken');
    }, output => output.push('<i></i>'), true);

    expect(out).toEqual(['<!--xd-t:0-->', '<b></b>']);
    expect(failed).toEqual(['<!--xd-t:1-->', '<i></i>']);
  });

  it('calls the content and the @catch with the component as this and the context of the scope holding the block', () => {
    const component = { name: 'card' };
    const componentContext = new _Context(context, undefined, 0, component);
    const calls = new Array<[unknown, unknown]>();

    _ssrTry([], componentContext, function (this: unknown, _output, contentContext) {
      calls.push([this, contentContext]);
      throw new Error('content');
    }, function (this: unknown, _output, catchContext) {
      calls.push([this, catchContext]);
    });

    expect(calls).toEqual([[component, componentContext], [component, componentContext]]);
  });

  it('lets the error of the @catch through, writing nothing', () => {
    const out: ServerOutput = [];
    const fallbackFailure = new Error('catch');

    expect(() => _ssrTry(out, context, () => {
      throw new Error('content');
    }, () => {
      throw fallbackFailure;
    })).toThrow(fallbackFailure);
    expect(out).toEqual([]);
  });
});
