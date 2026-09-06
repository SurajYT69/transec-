import { createClient } from './bot/client';
import { registerReadyEvent } from './bot/events/ready';
import { registerReactionAddEvent } from './bot/events/reactionAdd';
import { registerReactionRemoveEvent } from './bot/events/reactionRemove';
import { registerInteractionEvent } from './bot/events/interactionCreate';
import { TranslationService } from './services/translationService';
import { initializeDatabase } from './database/connection';
import { config } from './config';
import { createLogger } from './utils/logger';

const logger = createLogger('main');

async function main() {
  try {
    logger.info('Starting SmartTranslate...');
    
    initializeDatabase();
    logger.info('Database initialized');
    
    const service = new TranslationService();
    logger.info('Translation service initialized');
    
    const client = createClient();
    
    registerReadyEvent(client);
    registerReactionAddEvent(client, service);
    registerReactionRemoveEvent(client, service);
    registerInteractionEvent(client, service);
    
    await client.login(config.discord.token);
    
    process.on('SIGINT', () => {
      logger.info('Shutting down...');
      client.destroy();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      logger.info('Shutting down...');
      client.destroy();
      process.exit(0);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start SmartTranslate');
    process.exit(1);
  }
}

main();
