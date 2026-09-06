"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInteractionEvent = registerInteractionEvent;
const discord_js_1 = require("discord.js");
const translate_1 = require("../commands/translate");
const logger_1 = require("../../utils/logger");
const logger = (0, logger_1.createLogger)('interactionCreate');
function registerInteractionEvent(client, service) {
    client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
        try {
            if (interaction.isChatInputCommand()) {
                if (interaction.commandName === 'translate') {
                    await (0, translate_1.handleTranslateCommand)(interaction, service);
                }
            }
            if (interaction.isMessageContextMenuCommand()) {
                const targetLanguage = interaction.commandName === 'Translate to English' ? 'en' : 'hi';
                const message = interaction.targetMessage;
                await interaction.deferReply({ ephemeral: true });
                const result = await service.handleContextMenuTranslation(message.content, targetLanguage, interaction.guildId || '', interaction.channelId, interaction.user.id);
                if (result) {
                    await interaction.editReply({ content: result });
                }
                else {
                    await interaction.editReply({ content: 'No translation needed — the message appears to already be in the target language.' });
                }
            }
        }
        catch (error) {
            logger.error({ error }, 'Interaction create handler error');
        }
    });
}
//# sourceMappingURL=interactionCreate.js.map