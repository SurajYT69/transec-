"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTranslateCommand = handleTranslateCommand;
const guildSettingsDb = __importStar(require("../../database/guildSettings"));
const channelSettingsDb = __importStar(require("../../database/channelSettings"));
async function handleTranslateCommand(interaction, service) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
        case 'status': {
            const status = service.getStatus();
            const providerList = status.providers.map(p => `${p.available ? '🟢' : '🔴'} ${p.name} (failures: ${p.consecutiveFailures})`).join('\n');
            await interaction.reply({
                content: `**SmartTranslate Status**\n\nProviders:\n${providerList}\n\nCache: ${status.cacheSize} entries`,
                ephemeral: true,
            });
            break;
        }
        case 'settings': {
            const guildId = interaction.guildId;
            if (!guildId) {
                await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
                return;
            }
            const settings = guildSettingsDb.getOrCreateGuildSettings(guildId);
            const channelSettings = channelSettingsDb.getChannelSettings(interaction.channelId);
            await interaction.reply({
                content: `**Translation Settings**\n\nServer: ${settings.enabled ? '✅ Enabled' : '❌ Disabled'}\nReaction Translation: ${settings.reactionTranslationEnabled ? '✅' : '❌'}\nHindi: ${settings.allowHindi ? '✅' : '❌'}\nEnglish: ${settings.allowEnglish ? '✅' : '❌'}\nDelete on Remove: ${settings.deleteOnReactionRemove ? '✅' : '❌'}\nThis Channel: ${channelSettings ? (channelSettings.enabled ? '✅ Enabled' : '❌ Disabled') : '⬜ Default (enabled)'}`,
                ephemeral: true,
            });
            break;
        }
        case 'enable': {
            const guildId = interaction.guildId;
            if (!guildId) {
                await interaction.reply({ content: 'Server only.', ephemeral: true });
                return;
            }
            if (!interaction.memberPermissions?.has('ManageChannels')) {
                await interaction.reply({ content: 'You need **Manage Channels** permission.', ephemeral: true });
                return;
            }
            channelSettingsDb.upsertChannelSettings({ channelId: interaction.channelId, guildId, enabled: true });
            await interaction.reply({ content: '✅ Translation enabled in this channel.', ephemeral: true });
            break;
        }
        case 'disable': {
            const guildId = interaction.guildId;
            if (!guildId) {
                await interaction.reply({ content: 'Server only.', ephemeral: true });
                return;
            }
            if (!interaction.memberPermissions?.has('ManageChannels')) {
                await interaction.reply({ content: 'You need **Manage Channels** permission.', ephemeral: true });
                return;
            }
            channelSettingsDb.upsertChannelSettings({ channelId: interaction.channelId, guildId, enabled: false });
            await interaction.reply({ content: '❌ Translation disabled in this channel.', ephemeral: true });
            break;
        }
    }
}
//# sourceMappingURL=translate.js.map