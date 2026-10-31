import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../utils/build-project/build-project.utils', () => ({
  buildProject: vi.fn()
}));

import { buildProject } from '../../utils/build-project/build-project.utils';
import { buildCommand } from './build.command';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildCommand()', () => {
  it('registers the "build" command with its "b" alias', () => {
    const command = buildCommand();

    expect(command.name()).toBe('build');
    expect(command.aliases()).toContain('b');
  });

  it('builds the project', async () => {
    await buildCommand().parseAsync([], { from: 'user' });

    expect(buildProject).toHaveBeenCalledTimes(1);
  });
});
