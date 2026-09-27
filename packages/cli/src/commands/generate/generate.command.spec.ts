import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./component/component.command', () => ({
  generateComponent: vi.fn()
}));

import { generateComponent } from './component/component.command';
import { generateCommand } from './generate.command';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateCommand()', () => {
  it('registers the "component" command with its "c" alias, nested under "generate"', () => {
    const command = generateCommand();

    expect(command.name()).toBe('component');
    expect(command.aliases()).toContain('c');
    expect(command.parent?.name()).toBe('generate');
    expect(command.parent?.aliases()).toContain('g');
  });

  it('invokes generateComponent with the current working directory when no path option is given', () => {
    const command = generateCommand();

    command.parse(['my-button'], { from: 'user' });

    expect(generateComponent).toHaveBeenCalledWith('my-button', process.cwd(), false);
  });

  it('invokes generateComponent with the provided path and force options', () => {
    const command = generateCommand();

    command.parse(['my-button', '--path', '/projects/app', '--force'], { from: 'user' });

    expect(generateComponent).toHaveBeenCalledWith('my-button', '/projects/app', true);
  });
});
