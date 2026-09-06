import { Client, Events, Interaction } from 'discord.js';
import { TranslationService } from '../../services/translationService';
import { handleTranslateCommand } from '../commands/translate';
import { createLogger } from '../../utils/logger';

const logger = createLogger('interactionCreate');

export function registerInteractionEvent(client: Client, service: TranslationService): void {
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === 'translate') {
          await handleTranslateCommand(interaction, service);
        }
      }
      
      if (interaction.isMessageContextMenuCommand()) {
        const targetLanguage = interaction.commandName === 'Translate to English' ? 'en' : 'hi';
        const message = interaction.targetMessage;
        
        await interaction.deferReply({ ephemeral: true });
        
        const result = await service.handleContextMenuTranslation(
          message.content,
          targetLanguage,
          interaction.guildId || '',
          interaction.channelId,
          interaction.user.id
        );
        
        if (result) {
          await interaction.editReply({ content: result });
        } else {
          await interaction.editReply({ content: 'No translation needed — the message appears to already be in the target language.' });
        }
      }
    } catch (error) {
      logger.error({ error }, 'Interaction create handler error');
    }
  });
}
