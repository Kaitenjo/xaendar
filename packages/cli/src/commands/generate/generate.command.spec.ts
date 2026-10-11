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
  it('registers the "generate" command with its "g" alias, holding the "component" command with its "c" alias', () => {
    const command = generateCommand();
    const component = command.commands.find(subcommand => subcommand.name() === 'component');

    expect(command.name()).toBe('generate');
    expect(command.aliases()).toContain('g');
    expect(component?.aliases()).toContain('c');
  });

  it.each([['component'], ['c']])('invokes generateComponent with the current working directory when no path option is given, through "%s"', subcommand => {
    const command = generateCommand();

    command.parse([subcommand, 'my-button'], { from: 'user' });

    expect(generateComponent).toHaveBeenCalledWith('my-button', process.cwd(), false);
  });

  it('invokes generateComponent with the provided path and force options', () => {
    const command = generateCommand();

    command.parse(['component', 'my-button', '--path', '/projects/app', '--force'], { from: 'user' });

    expect(generateComponent).toHaveBeenCalledWith('my-button', '/projects/app', true);
  });
});
