import { ChatInputCommandInteraction } from 'discord.js';
import { TranslationService } from '../../services/translationService';
import * as guildSettingsDb from '../../database/guildSettings';
import * as channelSettingsDb from '../../database/channelSettings';

export async function handleTranslateCommand(
  interaction: ChatInputCommandInteraction,
  service: TranslationService,
): Promise<void> {
  const subcommand = interaction.options.getSubcommand();
  
  switch (subcommand) {
    case 'status': {
      const status = service.getStatus();
      const providerList = status.providers.map(p => 
        `${p.available ? '🟢' : '🔴'} ${p.name} (failures: ${p.consecutiveFailures})`
      ).join('\n');
      
      await interaction.reply({
        content: `**SmartTranslate Status**\n\nProviders:\n${providerList}\n\nCache: ${status.cacheSize} entries`,
        ephemeral: true,
      });
      break;
    }
    case 'settings': {
      const guildId = interaction.guildId;
      if (!guildId) { await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true }); return; }
      const settings = (guildSettingsDb as any).getOrCreateGuildSettings(guildId);
      const channelSettings = (channelSettingsDb as any).getChannelSettings(interaction.channelId);
      
      await interaction.reply({
        content: `**Translation Settings**\n\nServer: ${settings.enabled ? '✅ Enabled' : '❌ Disabled'}\nReaction Translation: ${settings.reactionTranslationEnabled ? '✅' : '❌'}\nHindi: ${settings.allowHindi ? '✅' : '❌'}\nEnglish: ${settings.allowEnglish ? '✅' : '❌'}\nDelete on Remove: ${settings.deleteOnReactionRemove ? '✅' : '❌'}\nThis Channel: ${channelSettings ? (channelSettings.enabled ? '✅ Enabled' : '❌ Disabled') : '⬜ Default (enabled)'}`,
        ephemeral: true,
      });
      break;
    }
    case 'enable': {
      const guildId = interaction.guildId;
      if (!guildId) { await interaction.reply({ content: 'Server only.', ephemeral: true }); return; }
      if (!interaction.memberPermissions?.has('ManageChannels')) {
        await interaction.reply({ content: 'You need **Manage Channels** permission.', ephemeral: true });
        return;
      }
      (channelSettingsDb as any).upsertChannelSettings({ channelId: interaction.channelId, guildId, enabled: true });
      await interaction.reply({ content: '✅ Translation enabled in this channel.', ephemeral: true });
      break;
    }
    case 'disable': {
      const guildId = interaction.guildId;
      if (!guildId) { await interaction.reply({ content: 'Server only.', ephemeral: true }); return; }
      if (!interaction.memberPermissions?.has('ManageChannels')) {
        await interaction.reply({ content: 'You need **Manage Channels** permission.', ephemeral: true });
        return;
      }
      (channelSettingsDb as any).upsertChannelSettings({ channelId: interaction.channelId, guildId, enabled: false });
      await interaction.reply({ content: '❌ Translation disabled in this channel.', ephemeral: true });
      break;
    }
  }
}
