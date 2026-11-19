import { describe, expect, it, vi } from 'vitest';
import { EventOptions } from '../event-options/event-options';
import { Output } from './output';

describe('Output', () => {
  it('exposes the function it is created with as dispatch', () => {
    const dispatch = vi.fn();

    expect(new Output<number>(dispatch).dispatch).toBe(dispatch);
  });

  it('calls it with the detail and the options of the dispatch', () => {
    const dispatch = vi.fn();
    const options = new EventOptions({ bubbles: true });
    const output = new Output<number>(dispatch);
    output.dispatch(1, options);
    output.dispatch(2);

    expect(dispatch.mock.calls).toEqual([[1, options], [2]]);
  });

  it('can be told from any other member by instanceof', () => {
    expect(new Output(vi.fn())).toBeInstanceOf(Output);
    expect({ dispatch: vi.fn() }).not.toBeInstanceOf(Output);
  });
});
