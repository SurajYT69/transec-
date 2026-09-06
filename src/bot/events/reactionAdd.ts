import { Client, Events, MessageReaction, User, PartialMessageReaction, PartialUser } from 'discord.js';
import { REACTION_FLAGS } from '../../types';
import { TranslationService } from '../../services/translationService';
import { createLogger } from '../../utils/logger';

const logger = createLogger('reactionAdd');

export function registerReactionAddEvent(client: Client, service: TranslationService): void {
  client.on(Events.MessageReactionAdd, async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
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
      const channelId = message.channel.id;
      const messageId = message.id;
      
      if (user.partial) {
        try { await user.fetch(); } catch { return; }
      }
      
      await service.handleReactionAdd(
        messageId,
        channelId,
        guildId,
        user.id,
        targetLanguage,
        async () => {
          const msg = message.partial ? await message.fetch() : message;
          return {
            content: msg.content || '',
            authorId: msg.author?.id || '',
            botAuthor: msg.author?.bot || false,
          };
        },
        async (content: string) => {
          const fetched = message.partial ? await message.fetch() : message;
          const sent = await fetched.reply({ content, allowedMentions: { repliedUser: false } });
          return sent.id;
        }
      );
    } catch (error) {
      logger.error({ error, messageId: reaction.message.id }, 'Reaction add handler error');
    }
  });
}
