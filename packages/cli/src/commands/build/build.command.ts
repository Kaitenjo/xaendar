import { Command } from 'commander';
import { build } from 'vite';
import { PLUGINS } from '../../utils/plugins';

export function buildCommand(): Command {
  return new Command('build')
    .alias('b')
    .description('Build the project')
    .action(async () => {
      await build({
        plugins: PLUGINS
      });
    });
}