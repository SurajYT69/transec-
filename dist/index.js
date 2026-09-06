"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("./bot/client");
const ready_1 = require("./bot/events/ready");
const reactionAdd_1 = require("./bot/events/reactionAdd");
const reactionRemove_1 = require("./bot/events/reactionRemove");
const interactionCreate_1 = require("./bot/events/interactionCreate");
const translationService_1 = require("./services/translationService");
const connection_1 = require("./database/connection");
const config_1 = require("./config");
const logger_1 = require("./utils/logger");
const logger = (0, logger_1.createLogger)('main');
async function main() {
    try {
        logger.info('Starting SmartTranslate...');
        (0, connection_1.initializeDatabase)();
        logger.info('Database initialized');
        const service = new translationService_1.TranslationService();
        logger.info('Translation service initialized');
        const client = (0, client_1.createClient)();
        (0, ready_1.registerReadyEvent)(client);
        (0, reactionAdd_1.registerReactionAddEvent)(client, service);
        (0, reactionRemove_1.registerReactionRemoveEvent)(client, service);
        (0, interactionCreate_1.registerInteractionEvent)(client, service);
        await client.login(config_1.config.discord.token);
        process.on('SIGINT', () => {
            logger.info('Shutting down...');
            client.destroy();
            process.exit(0);
        });
        process.on('SIGTERM', () => {
            logger.info('Shutting down...');
            client.destroy();
            process.exit(0);
        });
    }
    catch (error) {
        logger.fatal({ error }, 'Failed to start SmartTranslate');
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map