import { config } from './config';
import { registerCommands } from './bot/commands/registry';
import { createLogger } from './utils/logger';

const logger = createLogger('deploy');

async function main() {
  try {
    logger.info('Registering application commands...');
    await registerCommands();
    logger.info('Commands registered successfully!');
  } catch (error) {
    logger.error({ error }, 'Failed to register commands');
    process.exit(1);
  }
}

main();
