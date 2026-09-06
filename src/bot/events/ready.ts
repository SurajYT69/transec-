import { Client, Events } from 'discord.js';
import { createLogger } from '../../utils/logger';

const logger = createLogger('ready');

export function registerReadyEvent(client: Client): void {
  client.once(Events.ClientReady, (readyClient) => {
    logger.info({ tag: readyClient.user.tag, guilds: readyClient.guilds.cache.size }, 'Bot is online');
  });
}
