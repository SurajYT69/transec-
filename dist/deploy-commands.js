"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const registry_1 = require("./bot/commands/registry");
const logger_1 = require("./utils/logger");
const logger = (0, logger_1.createLogger)('deploy');
async function main() {
    try {
        logger.info('Registering application commands...');
        await (0, registry_1.registerCommands)();
        logger.info('Commands registered successfully!');
    }
    catch (error) {
        logger.error({ error }, 'Failed to register commands');
        process.exit(1);
    }
}
main();
//# sourceMappingURL=deploy-commands.js.map