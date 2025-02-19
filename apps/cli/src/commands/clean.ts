import { Command } from 'commander';
import { existsSync } from 'fs';
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import Database from "better-sqlite3";
import { checkEnvironment } from './utils.js';
import { getConfig } from './utils.js';
import { elizaLogger } from '@elizaos/core';

export async function cleanCommand() {
    try {
        await checkEnvironment();
        const { paths } = getConfig();

        if (!existsSync(paths.dbPath)) {
            elizaLogger.info('Database does not exist.');
            return;
        }

        // Reinitialize empty database
        const db = new SqliteDatabaseAdapter(new Database(paths.dbPath));
        await db.init();

        elizaLogger.info('Database cleaned successfully.');
    } catch (error) {
        elizaLogger.error('Failed to clean database:', error);
        process.exit(1);
    }
}

export function registerCleanCommand(program: Command) {
    program
        .command('clean')
        .description('Clean vonNewman database')
        .action(cleanCommand);
} 
