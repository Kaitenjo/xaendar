import { Command } from 'commander';
import { createServer } from 'vite';
import { createPlugins } from '../../utils/plugins';

export function startCommand(): Command {
  return new Command('start')
    .alias('s')
    .description('Start the project')
    .action(async () => {
      const server = await createServer({
        plugins: createPlugins()
      });

      await server.listen();
    });
}