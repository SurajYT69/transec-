import { ChannelSettings } from '../types';
/**
 * Retrieves the settings for a specific channel.
 * @param channelId The ID of the channel
 * @returns The channel settings or null if not found
 */
export declare function getChannelSettings(channelId: string): ChannelSettings | null;
/**
 * Updates or inserts channel settings.
 * @param settings Partial settings to update
 * @returns The updated or newly created channel settings
 */
export declare function upsertChannelSettings(settings: Partial<ChannelSettings> & {
    channelId: string;
    guildId: string;
}): ChannelSettings;
/**
 * Checks if a channel is enabled for translation.
 * @param channelId The ID of the channel
 * @param guildId The ID of the guild
 * @returns True if the channel is enabled, false otherwise
 */
export declare function isChannelEnabled(channelId: string, guildId: string): boolean;
//# sourceMappingURL=channelSettings.d.ts.map