"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = createClient;
const discord_js_1 = require("discord.js");
function createClient() {
    return new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.GuildMessageReactions,
            discord_js_1.GatewayIntentBits.MessageContent,
        ],
        partials: [
            discord_js_1.Partials.Message,
            discord_js_1.Partials.Channel,
            discord_js_1.Partials.Reaction,
        ],
    });
}
//# sourceMappingURL=client.js.map