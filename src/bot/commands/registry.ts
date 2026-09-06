import { SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType, REST, Routes } from 'discord.js';
import { config } from '../../config';

export function getCommands() {
  return [
    new SlashCommandBuilder()
      .setName('translate')
      .setDescription('SmartTranslate translation commands')
      .addSubcommand(sub =>
        sub.setName('status').setDescription('Show translation bot status')
      )
      .addSubcommand(sub =>
        sub.setName('settings').setDescription('View current translation settings')
      )
      .addSubcommand(sub =>
        sub.setName('enable').setDescription('Enable translation in this channel')
      )
      .addSubcommand(sub =>
        sub.setName('disable').setDescription('Disable translation in this channel')
      )
      .toJSON(),
    
    new ContextMenuCommandBuilder()
      .setName('Translate to English')
      .setType(ApplicationCommandType.Message)
      .toJSON(),
    
    new ContextMenuCommandBuilder()
      .setName('Translate to Hindi')
      .setType(ApplicationCommandType.Message)
      .toJSON(),
  ];
}

export async function registerCommands(): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(config.discord.token);
  const commands = getCommands();
  
  await rest.put(
    Routes.applicationCommands(config.discord.clientId),
    { body: commands },
  );
}
