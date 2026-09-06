import { GuildSettings } from '../types';
/**
 * Retrieves the settings for a specific guild.
 * @param guildId The ID of the guild
 * @returns The guild settings or null if not found
 */
export declare function getGuildSettings(guildId: string): GuildSettings | null;
/**
 * Updates or inserts guild settings.
 * @param settings Partial settings to update
 * @returns The updated or newly created guild settings
 */
export declare function upsertGuildSettings(settings: Partial<GuildSettings> & {
    guildId: string;
}): GuildSettings;
/**
 * Retrieves guild settings or creates them with defaults if they don't exist.
 * @param guildId The ID of the guild
 * @returns The existing or newly created guild settings
 */
export declare function getOrCreateGuildSettings(guildId: string): GuildSettings;
//# sourceMappingURL=guildSettings.d.ts.map