import { Client, Events, MessageReaction, User, PartialMessageReaction, PartialUser } from 'discord.js';
import { REACTION_FLAGS } from '../../types';
import { TranslationService } from '../../services/translationService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('reactionRemove');

export function registerReactionRemoveEvent(client: Client, service: TranslationService): void {
  client.on(Events.MessageReactionRemove, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
    try {
      if (user.bot) return;
      
      if (reaction.partial) {
        try { await reaction.fetch(); } catch { return; }
      }
      
      const emojiName = reaction.emoji.name;
      if (!emojiName || !(emojiName in REACTION_FLAGS)) return;
      
      const targetLanguage = REACTION_FLAGS[emojiName];
      const message = reaction.message;
      if (!message.guild) return;
      
      const guildId = message.guild.id;
      const messageId = message.id;
      
      if (user.partial) {
        try { await user.fetch(); } catch { return; }
      }
      
      await service.handleReactionRemove(
        messageId,
        targetLanguage,
        user.id,
        guildId,
        async (channelId: string, msgId: string) => {
          try {
            const channel = await client.channels.fetch(channelId);
            if (channel && channel.isTextBased() && 'messages' in channel) {
              const msg = await channel.messages.fetch(msgId).catch(() => null);
              if (msg && msg.deletable) {
                await msg.delete().catch(() => {});
              }
            }
          } catch (e) {
            // Message deleted fine
          }
        }
      );
    } catch (error) {
      logger.error({ error, messageId: reaction.message.id }, 'Reaction remove handler error');
    }
  });
}
