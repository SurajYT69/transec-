"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReactionAddEvent = registerReactionAddEvent;
const discord_js_1 = require("discord.js");
const types_1 = require("../../types");
const logger_1 = require("../../utils/logger");
const logger = (0, logger_1.createLogger)('reactionAdd');
function registerReactionAddEvent(client, service) {
    client.on(discord_js_1.Events.MessageReactionAdd, async (reaction, user) => {
        try {
            if (user.bot)
                return;
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                }
                catch {
                    return;
                }
            }
            const emojiName = reaction.emoji.name;
            if (!emojiName || !(emojiName in types_1.REACTION_FLAGS))
                return;
            const targetLanguage = types_1.REACTION_FLAGS[emojiName];
            const message = reaction.message;
            if (!message.guild)
                return;
            const guildId = message.guild.id;
            const channelId = message.channel.id;
            const messageId = message.id;
            if (user.partial) {
                try {
                    await user.fetch();
                }
                catch {
                    return;
                }
            }
            await service.handleReactionAdd(messageId, channelId, guildId, user.id, targetLanguage, async () => {
                const msg = message.partial ? await message.fetch() : message;
                return {
                    content: msg.content || '',
                    authorId: msg.author?.id || '',
                    botAuthor: msg.author?.bot || false,
                };
            }, async (content) => {
                const fetched = message.partial ? await message.fetch() : message;
                const sent = await fetched.reply({ content, allowedMentions: { repliedUser: false } });
                return sent.id;
            });
        }
        catch (error) {
            logger.error({ error, messageId: reaction.message.id }, 'Reaction add handler error');
        }
    });
}
//# sourceMappingURL=reactionAdd.js.map