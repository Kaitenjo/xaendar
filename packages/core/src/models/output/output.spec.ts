import { describe, expect, it, vi } from 'vitest';
import { EventOptions } from '../event-options/event-options';
import { Output } from './output';

describe('Output', () => {
  it('exposes the function it is created with as emit', () => {
    const emit = vi.fn();

    expect(new Output<number>(emit).emit).toBe(emit);
  });

  it('calls it with the detail and the options of the emission', () => {
    const emit = vi.fn();
    const options = new EventOptions({ bubbles: true });
    const output = new Output<number>(emit);
    output.emit(1, options);
    output.emit(2);

    expect(emit.mock.calls).toEqual([[1, options], [2]]);
  });

  it('can be told from any other member by instanceof', () => {
    expect(new Output(vi.fn())).toBeInstanceOf(Output);
    expect({ emit: vi.fn() }).not.toBeInstanceOf(Output);
  });
});
