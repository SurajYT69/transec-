"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReadyEvent = registerReadyEvent;
const discord_js_1 = require("discord.js");
const logger_1 = require("../../utils/logger");
const logger = (0, logger_1.createLogger)('ready');
function registerReadyEvent(client) {
    client.once(discord_js_1.Events.ClientReady, (readyClient) => {
        logger.info({ tag: readyClient.user.tag, guilds: readyClient.guilds.cache.size }, 'Bot is online');
    });
}
//# sourceMappingURL=ready.js.map