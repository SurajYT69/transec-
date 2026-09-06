"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommands = getCommands;
exports.registerCommands = registerCommands;
const discord_js_1 = require("discord.js");
const config_1 = require("../../config");
function getCommands() {
    return [
        new discord_js_1.SlashCommandBuilder()
            .setName('translate')
            .setDescription('SmartTranslate translation commands')
            .addSubcommand(sub => sub.setName('status').setDescription('Show translation bot status'))
            .addSubcommand(sub => sub.setName('settings').setDescription('View current translation settings'))
            .addSubcommand(sub => sub.setName('enable').setDescription('Enable translation in this channel'))
            .addSubcommand(sub => sub.setName('disable').setDescription('Disable translation in this channel'))
            .toJSON(),
        new discord_js_1.ContextMenuCommandBuilder()
            .setName('Translate to English')
            .setType(discord_js_1.ApplicationCommandType.Message)
            .toJSON(),
        new discord_js_1.ContextMenuCommandBuilder()
            .setName('Translate to Hindi')
            .setType(discord_js_1.ApplicationCommandType.Message)
            .toJSON(),
    ];
}
async function registerCommands() {
    const rest = new discord_js_1.REST({ version: '10' }).setToken(config_1.config.discord.token);
    const commands = getCommands();
    await rest.put(discord_js_1.Routes.applicationCommands(config_1.config.discord.clientId), { body: commands });
}
//# sourceMappingURL=registry.js.map