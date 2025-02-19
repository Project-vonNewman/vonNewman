#!/usr/bin/env tsx
/**
 * vonNewman CLI Entry Point
 * 
 * This is the main entry point for the vonNewman CLI. It sets up the command-line interface
 * and registers all available commands. The CLI can be run in two modes:
 * 
 * 1. Development mode: Using `vonNewman-dev` command (runs TypeScript directly)
 * 2. Production mode: Using `vonNewman` command (runs compiled JavaScript)
 * 
 * @module cli
 */

import { elizaLogger } from '@elizaos/core';
import { Command } from 'commander';
import { config } from 'dotenv';
import { join } from 'path';
import { homedir } from 'os';
import { existsSync, mkdirSync } from 'fs';

// Import commands
import { registerInitCommand } from './commands/init.js';
import { registerCleanCommand } from './commands/clean.js';
import { registerUninstallCommand } from './commands/uninstall.js';
import { registerStartCommand, startCommand } from './commands/start.js';
import { registerAddCommand } from './commands/add.js';

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    elizaLogger.error('\n❌ Uncaught Exception:');
    elizaLogger.error(error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
        elizaLogger.error('\nStack trace:');
        elizaLogger.error(error.stack);
    }
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    elizaLogger.error('\n❌ Unhandled Promise Rejection:');
    elizaLogger.error(error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
        elizaLogger.error('\nStack trace:');
        elizaLogger.error(error.stack);
    }
    process.exit(1);
});

/**
 * Ensures the vonNewman directory exists
 * @returns {string} Path to the vonNewman directory
 */
function ensurevonNewmanDir(): string {
    const vonNewmanDirPath = join(homedir(), '.vonNewman');
    if (!existsSync(vonNewmanDirPath)) {
        mkdirSync(vonNewmanDirPath, { recursive: true });
    }
    return vonNewmanDirPath;
}

async function main() {
    try {
        // Ensure vonNewman directory exists and load environment variables
        const vonNewmanDirPath = ensurevonNewmanDir();
        config({ path: join(vonNewmanDirPath, '.env') });

        const program = new Command();

        // Setup main program
        program
            .name('vonNewman')
            .description('vonNewman CLI - Enterprise AI Agent')
            .version('0.1.0');

        // Register all available commands
        registerInitCommand(program);
        registerCleanCommand(program);
        registerUninstallCommand(program);
        registerStartCommand(program);
        registerAddCommand(program);

        // Add default help command
        program.addHelpCommand('help [command]', 'Display help for command');

        // Handle unknown commands as messages
        program
            .arguments('[message...]')
            .action(async (args) => {
                if (args && args.length > 0) {
                    const message = args.join(' ');
                    const { handleSingleMessage } = await import('./commands/start.js');
                    await handleSingleMessage(message);
                } else {
                    program.help();
                }
            });

            // If no arguments provided, start in interactive mode
        if (process.argv.length <= 2) {
            // Load environment variables
            // Start in interactive mode
            await startCommand();
        } else {
            // Parse command line arguments
            await program.parseAsync();
        }
    } catch (error) {
        elizaLogger.error('\n❌ CLI Error:');
        elizaLogger.error(error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
            elizaLogger.error('\nStack trace:');
            elizaLogger.error(error.stack);
        }
        process.exit(1);
    }
}

// Start the CLI
main();
