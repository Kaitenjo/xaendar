import { Command } from 'commander';
import { createServer } from 'vite';
import { createPlugins } from '../../utils/plugins';
import { enterProject } from '../../utils/xaendar-config/xaendar-config.utils';

export function startCommand(): Command {
  return new Command('start')
    .alias('s')
    .description('Start the project')
    .action(async () => {
      enterProject();
      const server = await createServer({
        plugins: createPlugins()
      });

      await server.listen();
    });
}