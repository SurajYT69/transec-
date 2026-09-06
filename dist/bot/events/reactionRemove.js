"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReactionRemoveEvent = registerReactionRemoveEvent;
const discord_js_1 = require("discord.js");
const types_1 = require("../../types");
const logger_1 = require("../../utils/logger");
const logger = (0, logger_1.createLogger)('reactionRemove');
function registerReactionRemoveEvent(client, service) {
    client.on(discord_js_1.Events.MessageReactionRemove, async (reaction, user) => {
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
            const messageId = message.id;
            if (user.partial) {
                try {
                    await user.fetch();
                }
                catch {
                    return;
                }
            }
            await service.handleReactionRemove(messageId, targetLanguage, user.id, guildId, async (channelId, msgId) => {
                try {
                    const channel = await client.channels.fetch(channelId);
                    if (channel && channel.isTextBased() && 'messages' in channel) {
                        const msg = await channel.messages.fetch(msgId).catch(() => null);
                        if (msg && msg.deletable) {
                            await msg.delete().catch(() => { });
                        }
                    }
                }
                catch (e) {
                    // Message deleted fine
                }
            });
        }
        catch (error) {
            logger.error({ error, messageId: reaction.message.id }, 'Reaction remove handler error');
        }
    });
}
//# sourceMappingURL=reactionRemove.js.map