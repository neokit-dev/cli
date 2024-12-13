import { Command } from 'commander';
import { setup } from './commands/setup';

const program = new Command();
program.name('nktool').description('NeoKit CLI').version('1.1.0');

program
  .command('setup')
  .description('Setup NeoKit')
  .option('-h, --hook', 'Automatically bind NeoKit into hooks.server.ts')
  .action(setup);

program.parse();
